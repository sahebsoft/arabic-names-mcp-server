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

// Elasticsearch client singleton
let client;

function getElasticClient() {
  if (!client) {
    const {
      ELASTIC_HOST,
      ELASTIC_PORT,
      ELASTIC_USERNAME,
      ELASTIC_PASSWORD,
      ELASTIC_CA_CERT
    } = process.env;

    if (
      !ELASTIC_HOST ||
      !ELASTIC_PORT ||
      !ELASTIC_USERNAME ||
      !ELASTIC_PASSWORD ||
      !ELASTIC_CA_CERT
    ) {
      console.error({
        ELASTIC_HOST,
        ELASTIC_PORT,
        ELASTIC_USERNAME,
        ELASTIC_PASSWORD,
        ELASTIC_CA_CERT
      });
      throw new Error("Missing one of the ELASTIC_* environment variables");
    }

    const node = `https://${ELASTIC_HOST}:${ELASTIC_PORT}`;
    console.error("Connecting to Elasticsearch at:", node);

    client = new Client({
      node: node,
      auth: { username: ELASTIC_USERNAME, password: ELASTIC_PASSWORD },
      tls: {
        ca: ELASTIC_CA_CERT,
        rejectUnauthorized: false,
      },
    });
  }
  return client;
}

// Initialize Elasticsearch client
let esClient;
try {
  esClient = getElasticClient();
  console.error('Elasticsearch client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Elasticsearch client:', error);
  process.exit(1);
}

// Elasticsearch index name
const NAMES_INDEX = 'arabic_names';

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
        inputSchema: {
          type: "object",
          properties: {
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

      try {
        // Search for the name in Elasticsearch
        const response = await esClient.get({
          index: NAMES_INDEX,
          id: nameId
        });

        if (response.found) {
          const nameData = response._source;
          const basicInfo = {
            arabic: nameData.arabic || "",
            status: nameData.status || "pending",
            id: nameId
          };

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(basicInfo, null, 2)
              }
            ]
          };
        } else {
          // Create a new entry with basic info if not found
          const newEntry = {
            arabic: "",
            status: "pending",
            id: nameId
          };

          // Store the new entry in Elasticsearch
          await esClient.index({
            index: NAMES_INDEX,
            id: nameId,
            body: newEntry
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(newEntry, null, 2)
              }
            ]
          };
        }
      } catch (error) {
        if (error.meta && error.meta.statusCode === 404) {
          // Document not found, create a new entry
          const newEntry = {
            arabic: "",
            status: "pending",
            id: nameId
          };

          try {
            await esClient.index({
              index: NAMES_INDEX,
              id: nameId,
              body: newEntry
            });

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(newEntry, null, 2)
                }
              ]
            };
          } catch (indexError) {
            console.error('Error creating new entry in Elasticsearch:', indexError);
            throw new Error(`Failed to create new entry: ${indexError.message}`);
          }
        } else {
          console.error('Error reading from Elasticsearch:', error);
          throw new Error(`Failed to read name: ${error.message}`);
        }
      }
    }

    case "submit-name-details": {
      const nameDetails = args;

      if (!nameDetails.arabic) {
        throw new Error("Arabic name is required");
      }

      // Generate UUID for the name if not provided
      const nameId = uuidv4();

      // Store the complete name details
      const completeNameData = {
        ...nameDetails,
        id: nameId,
        status: "completed",
        submittedAt: new Date().toISOString()
      };

      try {
        // Store in Elasticsearch
        const response = await esClient.index({
          index: NAMES_INDEX,
          id: nameId,
          body: completeNameData,
          refresh: 'wait_for' // Ensure the document is immediately searchable
        });

        console.error(`Name details stored in Elasticsearch. ID: ${nameId}, Result: ${response.result}`);

        return {
          content: [
            {
              type: "text",
              text: `Name details submitted successfully. ID: ${nameId}\n\n${JSON.stringify(completeNameData, null, 2)}`
            }
          ]
        };
      } catch (error) {
        console.error('Error storing name details in Elasticsearch:', error);
        throw new Error(`Failed to submit name details: ${error.message}`);
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Arabic Names MCP Server running on stdio with Elasticsearch integration");
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});