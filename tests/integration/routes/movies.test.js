const request = require('supertest');
const {Movie} = require('../../../models/movie');
const {User} = require('../../../models/user');
const {Genre} = require('../../../models/genre');
const mongoose = require('mongoose');

let server;
  
describe('/api/movies', () => {
  beforeEach(() => { server = require('../../../index'); })
  afterEach(async () => { 
    await server.close(); 
    await Genre.remove({});
    await Movie.remove({});
   });

  describe('GET /', () => {
    it('should return all movies', async () => {
        let genre = new Genre({ name: 'genre1' });
        genre = await genre.save(); 

        let res = await request(server).get('/api/genres');
        expect(res.status).toBe(200);
        const genres = [
            { name: 'genre1' },
            { name: 'genre2' },
          ];
    
        let movies = [
            {
            title: 'movie1',
            genre: genre,
            numberInStock: 5,
            dailyRentalRate: 10 
            },
            {
            title: 'movie2',
            genre: genre,
            numberInStock: 5,
            dailyRentalRate: 10 
            }
        ];
        await Movie.collection.insertMany(movies);
        res = await request(server).get('/api/movies'); 

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        
        movies = await Movie.find();
        res = await request(server).get('/api/movies');

        expect(res.status).toBe(200); 
        expect(res.body.some( m => m.title === 'movie1')).toBeTruthy(); 
    });
  });
  describe('GET /:id', () => {
    it('should return a movie if valid id is passed', async () => {
        // first create genre
        let genre = new Genre({ name: 'genre1' });
        genre = await genre.save(); 
        let res = await request(server).get('/api/genres');
        expect(res.status).toBe(200);
        
        const aMovie = {
            title: 'movie1',
            genre: genre,
            numberInStock: 5,
            dailyRentalRate: 10 
        };
        // insert the movie with required genre
        const movie = new Movie(aMovie);
        await movie.save();
    
        res = await request(server).get('/api/movies/' + movie._id);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('title', movie.title);     
    });

    it('should return 404 if invalid id is passed', async () => {
      const res = await request(server).get('/api/movies/1');

      expect(res.status).toBe(404);
    });

    it('should return 404 if no movie with the given id exists', async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get('/api/movies/' + id);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /', () => {
    let token;
    let title = 'Movie1';
    let id;
    let numberInStock = 1;
    let dailyRentalRate = 10;

    const exec = async () => {
      return await request(server)
        .post('/api/movies')
        .set('x-auth-token', token)
        .send({ 
          title, 
          genreId: id, 
          numberInStock, 
          dailyRentalRate 
        });
    }
    const execGenre = async () => {
      genre = new Genre({ name: 'genre1' });
      await genre.save();
      id = genre._id;
    }

    beforeEach(() => {
      token = new User().generateAuthToken();      
    })

    it('should return a vaild movie object ', async () => {
      await execGenre();
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return 400 if title is less than 5 characters  ', async () => {
      title = '123';
      await execGenre();
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 if numberInStock is less than 1  ', async () => {
      title = 'Movie1';
      numberInStock = 0;
      await execGenre();
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it('should return 400 if dailyRentalRate is less than 1  ', async () => {
      title = 'Movie1';
      numberInStock = 3;
      dailyRentalRate = 1;
      await execGenre();
      const res = await exec();
      expect(res.status).toBe(400);
    });  
  });
}); 

