#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { v4 as uuidv4 } from 'uuid';
import { Client } from '@elastic/elasticsearch';

const server = new Server(
  {
    name: "arabic-names-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const submitNameDetailsScheme = {
  type: "object",
  properties: {
    id: {
      type: "string",
      description: "ID of the name"
    },
    arabic: {
      type: "string",
      description: "The Arabic name"
    },
    transliteration: {
      type: "string",
      description: "Accurate English transliteration"
    },
    meaning: {
      type: "string",
      description: "المعنى الدقيق والكامل للاسم باللغة العربية"
    },
    origin: {
      type: "string",
      description: "الأصل الدقيق للاسم (عربي، فارسي، تركي، إلخ)"
    },
    gender: {
      type: "string",
      description: "Gender (MALE/FEMALE/UNISEX)"
    },
    description: {
      type: "string",
      description: "وصف شامل للاسم يتضمن خصائصه ومميزاته باللغة العربية"
    },
    culturalSignificance: {
      type: "string",
      description: "الأهمية الثقافية والاجتماعية للاسم في الثقافة العربية والإسلامية"
    },
    famousPersons: {
      type: "array",
      description: "List of famous persons with this name",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          period: { type: "string" }
        }
      }
    },
    variations: {
      type: "array",
      description: "Name variations",
      items: {
        type: "object",
        properties: {
          variation: { type: "string" },
          type: { type: "string" },
          region: { type: "string" }
        }
      }
    },
    etymology: {
      type: "string",
      description: "أصل الاسم اللغوي والاشتقاقي بالتفصيل باللغة العربية"
    },
    linguisticRoot: {
      type: "string",
      description: "الجذر اللغوي (ثلاثي أو رباعي)"
    },
    numerologyValue: {
      type: "string",
      description: "القيمة العددية للاسم حسب علم الأرقام"
    },
    numerologyMeaning: {
      type: "string",
      description: "معنى الرقم في علم الأرقام باللغة العربية"
    },
    personality: {
      type: "object",
      properties: {
        traits: { type: "array", items: { type: "string" } },
        strengths: { type: "array", items: { type: "string" } },
        characteristics: { type: "string" }
      }
    },
    compatibility: {
      type: "object",
      properties: {
        compatibleNames: { type: "array", items: { type: "string" } },
        compatibleSigns: { type: "array", items: { type: "string" } },
        recommendation: { type: "string" }
      }
    },
    historicalContext: {
      type: "string",
      description: "السياق التاريخي لاستخدام الاسم عبر العصور"
    },
    religiousSignificance: {
      type: "string",
      description: "الأهمية الدينية للاسم في الإسلام إن وجدت"
    },
    modernUsage: {
      type: "string",
      description: "الاستخدام المعاصر للاسم في العالم العربي"
    },
    pronunciationIpa: {
      type: "string",
      description: "النطق بالرموز الصوتية الدولية"
    },
    pronunciationGuide: {
      type: "string",
      description: "دليل النطق باللغة العربية"
    },
    relatedNames: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          transliteration: { type: "string" },
          relationship: { type: "string" }
        }
      }
    },
    exploreMoreNames: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          transliteration: { type: "string" }
        }
      }
    },
    nameDay: {
      type: "string",
      description: "يوم الاسم إن وجد في التقاليد"
    },
    popularityRank: {
      type: "string",
      description: "ترتيب الشعبية الحالي (1-1000)"
    },
    popularityTrend: {
      type: "string",
      enum: ["RISING", "FALLING", "STABLE", "NEW", "DECLINING"],
      description: "Popularity trend"
    },
    literaryReferences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          work: { type: "string" },
          author: { type: "string" },
          character: { type: "string" },
          context: { type: "string" }
        }
      }
    },
    symbolism: {
      type: "string",
      description: "الرمزية والمعاني الرمزية للاسم"
    },
    alternativeSpellings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          spelling: { type: "string" },
          script: { type: "string" },
          region: { type: "string" }
        }
      }
    }
  },
  required: ["arabic", "transliteration", "meaning", "origin", "gender"]
};

// Simple Elasticsearch client setup with fallback
function getElasticClient() {
  try {
    const {
      ELASTIC_URL = 'http://localhost:9200',
      ELASTIC_USERNAME,
      ELASTIC_PASSWORD,
      ELASTIC_CA_CERT
    } = process.env;

    const clientConfig = { node: ELASTIC_URL };

    if (ELASTIC_USERNAME && ELASTIC_PASSWORD) {
      clientConfig.auth = {
        username: ELASTIC_USERNAME,
        password: ELASTIC_PASSWORD
      };
    }

    if (ELASTIC_CA_CERT) {
      clientConfig.tls = {
        ca: require('fs').readFileSync(ELASTIC_CA_CERT),
        rejectUnauthorized: false
      };
    }

    return new Client(clientConfig);
  } catch (error) {
    console.error('Failed to initialize Elasticsearch client:', error.message);
    return null;
  }
}

// Initialize client with fallback
let esClient = getElasticClient();
const NAMES_INDEX = 'arabic_names';

// Simple in-memory fallback storage
const mockStorage = new Map();

// Helper function for ES operations with fallback
async function handleOperation(esOperation, fallbackOperation) {
  if (esClient) {
    try {
      return await esOperation();
    } catch (error) {
      console.error('Elasticsearch operation failed, using fallback:', error.message);
      esClient = null; // Disable ES for future operations
      return fallbackOperation(error);
    }
  }

}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read-name",
        description: "Read an Arabic name and return its basic information",
        inputSchema: {
          type: "object",
          properties: {
            nameId: {
              type: "string",
              description: "The UUID of the name to read"
            }
          },
          required: ["nameId"]
        }
      },
      {
        name: "submit-name-details",
        description: "Submit comprehensive details for an Arabic name",
        inputSchema: submitNameDetailsScheme
      },
      {
        name: "get-oldest-new-names",
        description: "Get the oldest names with status 'NEW', ordered by submission date",
        inputSchema: {
          type: "object",
          properties: {
            size: {
              type: "number",
              description: "Number of names to return (default: 10, max: 100)",
              minimum: 1,
              maximum: 100
            }
          },
          required: []
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "read-name": {
      const { nameId } = args;
      if (!nameId) {
        throw new Error("nameId is required");
      }

      const result = await handleOperation(
        // Elasticsearch operation
        async () => {
          const response = await esClient.get({
            index: NAMES_INDEX,
            id: nameId
          });

          if (response.found) {
            const nameData = response._source;
            return {
              arabic: nameData.arabic || "",
              status: nameData.status || "pending",
              id: nameId
            };
          }

          // Create new entry if not found
          const newEntry = { arabic: "", status: "pending", id: nameId };
          await esClient.index({
            index: NAMES_INDEX,
            id: nameId,
            body: newEntry
          });
          return newEntry;
        },
        // Fallback operation
        (error) => {
          let entry = mockStorage.get(nameId);
          if (!entry) {
            entry = { arabic: "", status: "pending", id: nameId };
            mockStorage.set(nameId, entry);
          }
          return entry;
        }
      );

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }

    case "submit-name-details": {
      const nameDetails = args;
      if (!nameDetails.arabic) {
        throw new Error("Arabic name is required");
      }

      const nameId = uuidv4();
      const completeNameData = {
        ...nameDetails,
        id: nameId,
        status: "SUCCESS",
        submittedAt: new Date().toISOString()
      };

      await handleOperation(
        // Elasticsearch operation
        async () => {
          await esClient.index({
            index: NAMES_INDEX,
            id: nameId,
            body: completeNameData,
            refresh: 'wait_for'
          });
          return true;
        },
        // Fallback operation
        (error) => {
          mockStorage.set(nameId, completeNameData);
          return true;
        }
      );

      return {
        content: [{
          type: "text",
          text: `Name details submitted successfully. ID: ${nameId}\n\n${JSON.stringify(completeNameData, null, 2)}`
        }]
      };
    }

    case "get-oldest-new-names": {
      const { size = 10 } = args;

      if (size < 1 || size > 100) {
        throw new Error("Size must be between 1 and 100");
      }

      const result = await handleOperation(
        // Elasticsearch operation
        async () => {
          const response = await esClient.search({
            index: NAMES_INDEX,
            body: {
              query: {
                term: { "status": "NEW" }
              },
              sort: [{ "createdAt": { "order": "asc" } }],
              size: size,
              _source: ["arabic", "status", "id"]
            }
          });



          const names = response.hits.hits.map(hit => ({
            arabic: hit._source.arabic || "",
            status: hit._source.status || "NEW",
            id: hit._source.id || hit._id
          }));

          console.error(JSON.stringify(names, null, 2))


          return {
            total: response.hits.total.value,
            returned: names.length,
            names: names
          };
        },
        // Fallback operation  
        (error) => {
          const newNames = Array.from(mockStorage.values())
            .filter(name => name.status === "NEW")
            .sort((a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0))
            .slice(0, size)
            .map(name => ({
              arabic: name.arabic || "",
              status: name.status || "NEW",
              id: name.id
            }));

          return {
            total: newNames.length,
            returned: newNames.length,
            names: newNames,
            note: "Using local storage - Elasticsearch not available!",
            error: error
          };
        }
      );

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Arabic Names MCP Server started successfully');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});