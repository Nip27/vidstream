import { MongoMemoryServer } from "mongodb-memory-server"
import mongoose from "mongoose"

let mongod

/**
 * Connect to the in-memory database before all tests.
 */
export const connect = async () => {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  await mongoose.connect(uri)
}

/**
 * Drop database, close the connection, and stop mongod.
 */
export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongod.stop()
}

/**
 * Remove all data from all collections between tests.
 */
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}
