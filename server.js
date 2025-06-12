#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
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
async function getElasticClient() {
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
      const fs = await import('fs');
      clientConfig.tls = {
        ca: fs.readFileSync(ELASTIC_CA_CERT),
        rejectUnauthorized: false
      };
    }

    return new Client(clientConfig);
  } catch (error) {
    console.error('Failed to initialize Elasticsearch client:', error.message);
    return null;
  }
}

// Initialize client later in main function
let esClient = null;
const NAMES_INDEX = 'arabic_names';

// Helper function for ES operations
async function handleOperation(esOperation) {
  if (!esClient) {
    throw new Error('Elasticsearch client not available');
  }

  try {
    return await esOperation();
  } catch (error) {
    console.error('Elasticsearch operation failed:', error.message);
    throw error;
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
        name: "procces-names",
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

      const completeNameData = {
        ...nameDetails,
        status: "NEW",
        processDate: new Date().toISOString()
      };

      await handleOperation(
        // Elasticsearch operation
        async () => {
          await esClient.index({
            index: NAMES_INDEX,
            id: nameDetails.id,
            body: completeNameData,
            refresh: 'wait_for'
          });
          return true;
        }
      );

      return {
        content: [{
          type: "text",
          text: `Name details submitted successfully. ID: ${nameDetails.id}\n\n${JSON.stringify(completeNameData, null, 2)}`
        }]
      };
    }

    case "procces-names": {
      const { size = 10 } = args;
      console.error(`get-new-names called with size: ${size}`);

      if (size < 1 || size > 100) {
        throw new Error("Size must be between 1 and 100");
      }

      const result = await handleOperation(
        // Elasticsearch operation
        async () => {
          console.error(`Searching for NEW names with size limit: ${size}`);
          const response = await esClient.search({
            index: NAMES_INDEX,
            body: {
              query: {
                term: { "status": "NEW" }
              },
              sort: [{ "processDate": { "order": "asc" } }],
              size: size,
              _source: ["arabic", "status", "id", "processDate"]
            }
          });

          console.error(`Elasticsearch response: total hits = ${response.hits.total.value}, returned = ${response.hits.hits.length}`);

          const names = response.hits.hits.map(hit => ({
            arabic: hit._source.arabic || "",
            status: hit._source.status || "NEW",
            id: hit._source.id || hit._id,
            processDate: hit._source.processDate
          }));

          const finalResult = {
            total: response.hits.total.value,
            returned: names.length,
            names: names
          };

          console.error(`procces-names result: ${JSON.stringify(finalResult, null, 2)}`);
          return finalResult;
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
    // Initialize Elasticsearch client
    esClient = await getElasticClient();

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