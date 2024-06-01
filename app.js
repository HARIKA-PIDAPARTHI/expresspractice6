const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

app.get('/states/', async (request, response) => {
  let query = `SELECT * FROM state;`
  let result = await db.all(query)
  response.send(result.map(each => convertDbObjectToResponseObject(each)))
})

app.get('/states/:stateId/', async (request, response) => {
  let {stateId} = request.params
  let query = `SELECT * FROM state WHERE state_id=${stateId};`
  let result = await db.get(query)
  response.send(convertDbObjectToResponseObject(result))
})

app.post('/districts/', async (request, response) => {
  let {stateId, districtName, cases, cured, active, deaths} = request.body
  let query = `INSERT INTO district (district_name,stateId ,cases,cured,active,deaths) 
  VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`
  let result = await db.run(query)
  response.send('District Successfully Added')
})

const convertDbObjectToResponseObject2 = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let query = `SELECT * FROM district WHERE district_id=${districtId};`
  let result = await db.get(query)
  response.send(convertDbObjectToResponseObject2(result))
})

app.delete('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let query = `DELETE FROM district WHERE district_id=${districtId};`
  await db.run(query)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let {districtName, stateId, cases, cured, active, deaths} = request.body
  let query = `UPDATE district 
  SET 
    district_name: '${districtName}',
    state_id: ${stateId},
    cases: ${cases},
    cured: ${cured},
    active: ${active},
    deaths: ${deaths}
    WHERE district_id=${districtId};`
  let result = await db.run(query)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  let {stateId} = request.params
  let query = `SELECT SUM(cases) AS totalCases,SUM(cured) AS totalCured,SUM(active) AS totalActive,SUM(deaths) AS totalDeaths
   FROM district WHERE state_id=${stateId};`
  let result = await db.get(query)
  response.send(result)
})

const convertto = dbObject => {
  return {
    stateName: dbObject.state_name,
  }
}

app.get('/districts/:districtId/details/', async (request, response) => {
  let {districtId} = request.params
  let query = `SELECT state_id FROM district WHERE district_id=${districtId};`
  let result = await db.get(query)
  let query2 = `SELECT state_name FROM state WHERE state_id=${result.state_id};`
  let result2 = await db.get(query2)
  response.send(convertto(result2))
})

module.exports = app
