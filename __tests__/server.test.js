'use strict';

// const socket = require('../socket');
const { getQuestions } = require('../index');

// jest.mock('../socket.js', () => {
//   return{
//     on: jest.fn(),
//     emit: jest.fn(),
//   };
// });

describe('handle server', () => {

  it('properly gets questions', async () => {
    let test = await getQuestions();
    let test2 = await getQuestions(5);
    expect(test.length).toEqual(10);
    expect(test2.length).toBe(5);
  });

});