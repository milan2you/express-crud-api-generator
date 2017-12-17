module.exports = {
  init: function(projectName) {
    return {
      info : {
        name: projectName,
        description: projectName + ' PostMan Collection',
        schema:
          'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
       
      },
      item: []
    }
  },
  appendModel: function(model, attributes) {
    let baseRaw = `http://localhost:3000/api/${model.plural}`
    return [
      {
        name: `Get all ${model.plural}`,
        request: {
          method: 'GET',
          header: [],
          body: {},
          url: {
            raw: baseRaw,
            protocol: 'http',
            host: ['localhost'],
            port: '3000',
            path: ['api', model.plural],
            query: []
          },
          description: null
        },
        response: []
      },
      {
        name: `Create new ${model.singular}`,
        request: {
          method: 'POST',
          header: [
            {
              key: 'Content-Type',
              value: 'application/x-www-form-urlencoded'
            }
          ],
          body: {
            mode: 'urlencoded',
            urlencoded : attributes.map(attribute => {
              return {
                key : attribute.name,
                value : '',
                type : 'text'
              }
            })
          },
          url: {
            raw: baseRaw,
            protocol: 'http',
            host: ['localhost'],
            port: '3000',
            path: ['api', model.plural],
            query: []
          },
          description: null
        },
        response: []
      },
      {
        name: `Get one ${model.singular}`,
        request: {
          method: 'GET',
          header: [],
          body: {},
          url: {
            raw: baseRaw + '/1',
            protocol: 'http',
            host: ['localhost'],
            port: '3000',
            path: ['api', model.plural, '1'],
            query: []
          },
          description: null
        },
        response: []
      },
      {
        name: `Update one ${model.singular}`,
        request: {
          method: 'PUT',
          header: [
            {
              key: 'Content-Type',
              value: 'application/x-www-form-urlencoded'
            }
          ],
          body: {
            mode: 'urlencoded',
            urlencoded : attributes.map(attribute => {
              return {
                key : attribute.name,
                value : '',
                type : 'text'
              }
            })
          },
          url: {
            raw: baseRaw + '/1',
            protocol: 'http',
            host: ['localhost'],
            port: '3000',
            path: ['api', model.plural, '1'],
            query: []
          },
          description: null
        },
        response: []
      },
      {
        name: `Delete one ${model.singular}`,
        request: {
          method: 'DELETE',
          header: [],
          body: {},
          url: {
            raw: baseRaw + '/1',
            protocol: 'http',
            host: ['localhost'],
            port: '3000',
            path: ['api', model.plural, '1'],
            query: []
          },
          description: null
        },
        response: []
      }
    ]
  }
}
