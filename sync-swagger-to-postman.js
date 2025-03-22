require('dotenv').config();
const fs = require('fs');

const POSTMAN_API_KEY = process.env.POSTMAN_API_KEY;
const BASE_URL = process.env.BASE_URL || 'https://api.example.com';
const WORKSPACE_ID = 'c9cde556-752a-4ce0-8a85-2b9156e7d844';
const SWAGGER_FILE_PATH = './public/swagger.json';
const CONFIG_FILE_PATH = './postman-config.json';

const swaggerJson = JSON.parse(fs.readFileSync(SWAGGER_FILE_PATH, 'utf8'));

function loadConfig() {
  try {
    return fs.existsSync(CONFIG_FILE_PATH)
      ? JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'))
      : { collectionId: null };
  } catch (error) {
    console.warn('Error loading config file:', error.message);
    return { collectionId: null };
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config file:', error.message);
  }
}

async function postmanApiRequest(endpoint, method = 'GET', body = null) {
  try {
    const response = await fetch(`https://api.getpostman.com/${endpoint}`, {
      method,
      headers: {
        'X-Api-Key': POSTMAN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const responseText = await response.text();
      throw new Error(
        `API Error: ${response.status}, Response: ${responseText}`,
      );
    }

    return response.json();
  } catch (error) {
    console.error(`Error in API request (${method} ${endpoint}):`, error);
    return null;
  }
}

async function checkCollectionExists(collectionId) {
  return await postmanApiRequest(`collections/${collectionId}`);
}

async function createCollection() {
  const responseData = await postmanApiRequest('import/openapi', 'POST', {
    type: 'json',
    input: swaggerJson,
    options: { workspaceId: WORKSPACE_ID },
  });

  if (responseData?.collections?.length) {
    const newCollectionId =
      responseData.collections[0].uid || responseData.collections[0].id;
    saveConfig({ collectionId: newCollectionId });
    return responseData;
  }

  throw new Error('No collection was created');
}

async function updateCollection(collectionId) {
  await postmanApiRequest(`collections/${collectionId}`, 'DELETE');
  return createCollection();
}

async function setBaseUrlVariable(collectionId, baseUrl) {
  try {
    const collectionResponse = await postmanApiRequest(
      `collections/${collectionId}`,
    );
    if (!collectionResponse || !collectionResponse.collection)
      throw new Error('Collection not found or response format incorrect');

    const collection = collectionResponse.collection;
    if (!collection.info || !collection.item)
      throw new Error(
        "Collection is missing required 'info' or 'item' properties.",
      );

    collection.variable = collection.variable || [];
    const baseUrlVariable = collection.variable.find(
      (v) => v.key === 'baseUrl',
    );

    if (baseUrlVariable) baseUrlVariable.value = baseUrl;
    else
      collection.variable.push({
        key: 'baseUrl',
        value: baseUrl,
        type: 'string',
      });

    const updateResponse = await postmanApiRequest(
      `collections/${collectionId}`,
      'PUT',
      { collection },
    );

    if (!updateResponse)
      throw new Error('Failed to update collection with baseUrl variable');

    return updateResponse;
  } catch (error) {
    console.error('Error setting base URL variable:', error);
    throw error;
  }
}

async function syncSwaggerToPostman() {
  try {
    const config = loadConfig();
    const collectionId = config.collectionId;
    const collectionExists = collectionId
      ? await checkCollectionExists(collectionId)
      : false;

    const result = collectionExists
      ? await updateCollection(collectionId)
      : await createCollection();

    const newCollectionId =
      result.collections[0].uid || result.collections[0].id;

    await setBaseUrlVariable(newCollectionId, BASE_URL);

    return result;
  } catch (error) {
    throw error;
  }
}

syncSwaggerToPostman()
  .then(() => console.log('Sync process completed successfully'))
  .catch(() => process.exit(1));
