'use strict';

const { sequelizeDB, userCollection } = require('../model');

beforeAll(async () => {
  await sequelizeDB.sync();
  await userCollection.create({ username: 'test', passphrase: 'testing test' });
  await userCollection.create({ username: 'test2', passphrase: 'testing test2' });
});

afterAll(async () => {
  await sequelizeDB.drop();
});

describe('handle models', () => {

  it('should find our records', async () => {

    const response = await userCollection.read();

    expect(response[0].username).toEqual('test');
    expect(response[0].passphrase).toEqual('testing test');
    expect(response[1].username).toEqual('test2');
    expect(response[1].passphrase).toEqual('testing test2');

  });

  it('should find our records', async () => {

    const response = await userCollection.read('test2');

    expect(response.username).toEqual('test2');
    expect(response.passphrase).toEqual('testing test2');

  });

  it('should create a record', async () => {

    await userCollection.create({ username: 'test3', passphrase: 'testing test 3' });

    const response = await userCollection.read('test3');

    expect(response.username).toEqual('test3');
    expect(response.passphrase).toEqual('testing test 3');

  });

  it('should update a record', async () => {
    const updatedUser = {
      passphrase: 'update',
    };

    await userCollection.update(updatedUser, 'test');
    const response = await userCollection.read();

    expect(response[0].username).toEqual('test');
    expect(response[0].passphrase).toEqual('update');

  });
  
  it('should delete a record', async () => {

    await userCollection.delete('test2');
    const response = await userCollection.read();

    expect(response[1].username).toEqual('test3');
    expect(response[1].passphrase).toEqual('testing test 3');

  });

});