const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'moviesData.db')

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertMovieNmaeToPascal = dbObject => {
  return {
    movieName: dbObject.movie_name,
  }
}

const convertMovieObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}
const convertDirectorObjectToResponseObject = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

app.get('/movies/', async (request, response) => {
  const getMovieQuery = `
        SELECT
        *
        FROM 
        movie;
    `
  const movieArray = await db.all(getMovieQuery)
  response.send(
    movieArray.map(movieName => convertMovieNmaeToPascal(movieName)),
  )
})

app.post('/movies/', async (request, response) => {
  const getMovieDetails = request.body
  const {directorId, movieName, leadActor} = getMovieDetails
  const createMovieQuery = `
        INSERT INTO 
        movie (director_id, movie_name, lead_actor)
        VALUES 
        (
          '${directorId}',
          '${movieName}',
          '${leadActor}'
        );
    `
  await db.run(createMovieQuery)
  response.send('Movie Successfully Added')
})

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `
        SELECT
        *
        FROM 
        movie
        WHERE 
        movie_id = ${movieId};
    `
  const movie = await db.get(getMovieQuery)
  console.log(movieId)
  response.send(convertMovieObjectToResponseObject(movie))
})

//4th Updates the details of a movie in the movie table based on the movie ID

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const putMovieQuery = `
        UPDATE 
        movie 
        SET
        director_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
        WHERE 
        movie_id = '${movieId};'
    `
  await db.run(putMovieQuery)
  response.send('Movie Details Updated')
})

//5th Deletes a movie from the movie table based on the movie ID

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
  DELETE FROM movie WHERE movie_id = '${movieId}'
  `
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

// 6th Returns a list of all directors in the director table
app.get('/directors/', async (request, response) => {
  const getDirectorQuery = `
        SELECT
        *
        FROM 
        director;
    `
  const directorArray = await db.all(getDirectorQuery)
  response.send(
    directorArray.map(director =>
      convertDirectorObjectToResponseObject(director),
    ),
  )
})

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getDirectorQuery = `
  SELECT 
  movie_name
  FROM
  director INNER JOIN movie 
  ON director.director_id = movie.director_id
  WHERE 
  director.director_id = ${directorId};
  `
  const movie = await db.all(getDirectorQuery)
  response.send(
    movie.map(movieName => convertMovieObjectToResponseObject(movieName)),
  )
})

module.exports = app
