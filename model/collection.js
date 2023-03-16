'use strict';

class Collection {
  constructor(model) {
    this.model = model;
  }

  async create(json) {
    try {
      // console.log('JSON SENT TO CREATE------>>>>>', json);
      const record = await this.model.create(json);
      // console.log('RETURNED RECORD---->>>', record);
      return record;
    } catch (error) {
      console.error('error in the collection interface');
      return error;
    }
  }

  async read(id = null) {
    try {
      if (!id) {
        //get all
        const records = await this.model.findAll();
        return records;
      } else {
        //get by id
        const singleRecord = await this.model.findByPk(id);
        return singleRecord;
      }
    } catch (error) {
      console.error('error in the collection interface');
      return error;
    }
  }

  async update(json, username) {
    try {
      console.log(json, username);
      const record = await this.model.update(json, { where: { username } });
      return record;
    } catch (error) {
      console.error('error in the collection interface');
      return error;
    }
  }

  async delete(username) {
    try {
      await this.model.destroy({ where: { username } });

    } catch (error) {
      console.error('error in the collection interface');
      return error;
    }
  }
}

module.exports = Collection;
