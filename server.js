#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { Client } from '@elastic/elasticsearch';

const server = new Server(
    {
        name: "arabic-names-explorer",
        version: "2.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

function transliterationToSlug(transliteration) {
    if (!transliteration || typeof transliteration !== 'string') {
        return '';
    }

    return transliteration
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const nameDetailsSchema = {
    type: "object",
    properties: {
        id: {
            type: "string",
            description: "Unique identifier for the name entry"
        },
        status: {
            type: "string",
            enum: ["SUCCESS", "INVALID"],
            description: "Status of Research , SUCCESS for Valid Arabic Names And INVALID for Invalid Names (but u still can suggest releated names)"
        },
        arabic: {
            type: "string",
            description: "The Arabic name in Arabic script (e.g., محمد, فاطمة, عبدالله)"
        },
        transliteration: {
            type: "string",
            description: "Accurate English transliteration (e.g., Muhammad, Fatimah, Abdullah)"
        },
        meaning: {
            type: "string",
            description: "Complete and precise meaning of the name in Arabic"
        },
        origin: {
            type: "string",
            description: "Precise origin of the name (Arabic, Persian, Turkish, Hebrew, etc.)"
        },
        gender: {
            type: "string",
            enum: ["MALE", "FEMALE", "UNISEX"],
            description: "Gender classification of the name"
        },
        description: {
            type: "string",
            description: "Comprehensive description including characteristics and qualities in Arabic"
        },
        culturalSignificance: {
            type: "string",
            description: "Cultural and social importance in Arab and Islamic culture (in Arabic)"
        },
        famousPersons: {
            type: "array",
            description: "Notable historical and contemporary figures with this name (in Arabic)",
            items: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Full name of the person" },
                    description: { type: "string", description: "Brief description of their significance" },
                    period: { type: "string", description: "Time period or dates (e.g., '7th century', '1950-2020')" },
                    field: { type: "string", description: "Field of achievement (religion, literature, politics, etc.)" }
                }
            }
        },
        variations: {
            type: "array",
            description: "Regional and linguistic variations of the name (in Arabic)",
            items: {
                type: "object",
                properties: {
                    variation: { type: "string", description: "The name variation" },
                    type: { type: "string", description: "Type of variation (diminutive, regional, etc.)" },
                    region: { type: "string", description: "Geographic region where used" },
                    script: { type: "string", description: "Writing script if different" }
                }
            }
        },
        etymology: {
            type: "string",
            description: "Detailed linguistic and etymological origin in Arabic"
        },
        linguisticRoot: {
            type: "string",
            description: "Linguistic root (trilateral or quadrilateral Arabic root)"
        },
        numerologyValue: {
            type: "string",
            description: "Numerical value according to Arabic numerology (Abjad)"
        },
        numerologyMeaning: {
            type: "string",
            description: "Meaning of the numerical value in Arabic numerology"
        },
        personality: {
            type: "object",
            properties: {
                traits: {
                    type: "array",
                    items: { type: "string" },
                    description: "Personality traits associated with the name"
                },
                strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "Positive characteristics and strengths"
                },
                characteristics: {
                    type: "string",
                    description: "Overall personality characteristics in Arabic"
                }
            }
        },
        compatibility: {
            type: "object",
            properties: {
                compatibleNames: {
                    type: "array",
                    items: { type: "string" },
                    description: "Names that pair well with this name"
                },
                compatibleSigns: {
                    type: "array",
                    items: { type: "string" },
                    description: "Compatible zodiac signs"
                },
                recommendation: {
                    type: "string",
                    description: "Compatibility recommendations in Arabic"
                }
            }
        },
        historicalContext: {
            type: "string",
            description: "Historical context of name usage across different eras"
        },
        religiousSignificance: {
            type: "string",
            description: "Religious importance in Islam, if applicable"
        },
        modernUsage: {
            type: "string",
            description: "Contemporary usage patterns in the Arab world"
        },
        pronunciationIpa: {
            type: "string",
            description: "Pronunciation in International Phonetic Alphabet"
        },
        pronunciationGuide: {
            type: "string",
            description: "Pronunciation guide in Arabic"
        },
        relatedNames: {
            type: "array",
            description: "Names with similar roots, meanings, or connections",
            items: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Related name in Arabic" },
                    transliteration: { type: "string", description: "English transliteration" },
                    relationship: { type: "string", description: "Type of relationship (same root, similar meaning, etc.)" }
                }
            }
        },
        exploreMoreNames: {
            type: "array",
            description: "Ten additional names for further exploration",
            items: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Arabic name" },
                    transliteration: { type: "string", description: "English transliteration" },
                    brief_meaning: { type: "string", description: "Brief meaning or significance" }
                }
            }
        },
        nameDay: {
            type: "string",
            description: "Name day celebration date, if applicable in traditions"
        },
        popularityRank: {
            type: "string",
            description: "Current popularity ranking (1-1000) in Arab countries"
        },
        popularityTrend: {
            type: "string",
            enum: ["RISING", "FALLING", "STABLE", "NEW", "DECLINING", "CLASSIC"],
            description: "Trend in name popularity over recent years"
        },
        literaryReferences: {
            type: "array",
            description: "References in Arabic literature and poetry",
            items: {
                type: "object",
                properties: {
                    work: { type: "string", description: "Title of literary work" },
                    author: { type: "string", description: "Author name" },
                    character: { type: "string", description: "Character name if applicable" },
                    context: { type: "string", description: "Context of the reference" },
                    period: { type: "string", description: "Historical period" }
                }
            }
        },
        symbolism: {
            type: "string",
            description: "Symbolic meanings and representations of the name"
        },
        alternativeSpellings: {
            type: "array",
            description: "Different spelling variations across regions",
            items: {
                type: "object",
                properties: {
                    spelling: { type: "string", description: "Alternative spelling" },
                    script: { type: "string", description: "Writing system used" },
                    region: { type: "string", description: "Geographic region" },
                    frequency: { type: "string", description: "How common this spelling is" }
                }
            }
        },
        seasonalAssociation: {
            type: "string",
            description: "Seasonal or temporal associations of the name"
        },
        colorAssociation: {
            type: "string",
            description: "Colors traditionally associated with the name"
        },
        gemstoneAssociation: {
            type: "string",
            description: "Gemstones or precious stones associated with the name"
        },
        slug: {
            type: "string",
            description: "URL-friendly slug generated from transliteration, used as identifier"
        }
    },
    required: ["arabic", "transliteration", "meaning", "origin", "gender"]
};

// Elasticsearch client setup
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

let esClient = null;
const NAMES_INDEX = 'arabic_names_v3';

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
                name: "get_name_details",
                description: "Retrieve comprehensive details for a specific Arabic name by its ID. Returns full name information including meaning, origin, cultural significance, and all associated metadata.",
                inputSchema: {
                    type: "object",
                    properties: {
                        nameId: {
                            type: "string",
                            description: "The unique identifier (UUID) of the Arabic name to retrieve"
                        }
                    },
                    required: ["nameId"]
                }
            },
            {
                name: "save_name_research",
                description: "Save comprehensive research data for an Arabic name including etymology, cultural significance, famous bearers, and related information. Use this after researching a name thoroughly.",
                inputSchema: nameDetailsSchema
            },
            {
                name: "get_pending_names",
                description: "Retrieve a list of Arabic names that need research and detailed information. Returns names with 'NEW' status ordered by submission date (oldest first).",
                inputSchema: {
                    type: "object",
                    properties: {
                        limit: {
                            type: "number",
                            description: "Maximum number of names to return (default: 10, max: 50)",
                            minimum: 1,
                            maximum: 50,
                            default: 10
                        }
                    }
                }
            },
            {
                name: "search_names",
                description: "Search for Arabic names using various criteria including name text, meaning, origin, or gender. Supports fuzzy matching and partial searches.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Search query - can be Arabic name, transliteration, or meaning"
                        },
                        gender: {
                            type: "string",
                            enum: ["MALE", "FEMALE", "UNISEX"],
                            description: "Filter by gender"
                        },
                        origin: {
                            type: "string",
                            description: "Filter by origin (Arabic, Persian, Turkish, etc.)"
                        },
                        status: {
                            type: "string",
                            enum: ["NEW", "SUCCESS", "PENDING", "INVALID"],
                            description: "Filter by processing status"
                        },
                        limit: {
                            type: "number",
                            description: "Maximum results to return (default: 20, max: 100)",
                            minimum: 1,
                            maximum: 100,
                            default: 20
                        }
                    },
                    required: ["query"]
                }
            },
            {
                name: "get_name_statistics",
                description: "Get statistics about the Arabic names database including total counts, status distribution, gender distribution, and origin distribution.",
                inputSchema: {
                    type: "object",
                    properties: {
                        detailed: {
                            type: "boolean",
                            description: "Whether to include detailed breakdowns (default: false)",
                            default: false
                        }
                    }
                }
            },
            {
                name: "find_similar_names",
                description: "Find names similar to a given Arabic name based on root, meaning, or phonetic similarity. Useful for discovering related names.",
                inputSchema: {
                    type: "object",
                    properties: {
                        arabicName: {
                            type: "string",
                            description: "The Arabic name to find similar names for"
                        },
                        similarityType: {
                            type: "string",
                            enum: ["root", "meaning", "phonetic", "all"],
                            description: "Type of similarity to search for (default: all)",
                            default: "all"
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of similar names to return (default: 15)",
                            minimum: 1,
                            maximum: 30,
                            default: 15
                        }
                    },
                    required: ["arabicName"]
                }
            },
            {
                name: "add_name_to_research_queue",
                description: "Add a new Arabic name to the research queue for future detailed analysis. Use this when you encounter a name that needs research.",
                inputSchema: {
                    type: "object",
                    properties: {
                        arabicName: {
                            type: "string",
                            description: "The Arabic name to add to research queue (required)"
                        },
                        transliteration: {
                            type: "string",
                            description: "English transliteration of the name (required)"
                        },
                        priority: {
                            type: "string",
                            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
                            description: "Research priority level (default: MEDIUM)",
                            default: "MEDIUM"
                        },
                        source: {
                            type: "string",
                            description: "Source where this name was encountered (optional)"
                        },
                        notes: {
                            type: "string",
                            description: "Any additional notes about the name (optional)"
                        }
                    },
                    required: ["arabicName"]
                }
            },
            {
                name: "get_names_by_origin",
                description: "Retrieve Arabic names filtered by their origin/etymology (Arabic, Persian, Turkish, Hebrew, etc.). Useful for cultural and linguistic analysis.",
                inputSchema: {
                    type: "object",
                    properties: {
                        origin: {
                            type: "string",
                            description: "Origin to filter by (e.g., 'Arabic', 'Persian', 'Turkish', 'Hebrew')"
                        },
                        gender: {
                            type: "string",
                            enum: ["MALE", "FEMALE", "UNISEX"],
                            description: "Optional gender filter"
                        },
                        limit: {
                            type: "number",
                            description: "Maximum results to return (default: 25)",
                            minimum: 1,
                            maximum: 100,
                            default: 25
                        },
                        includeDetails: {
                            type: "boolean",
                            description: "Whether to include full details or just basic info (default: false)",
                            default: false
                        }
                    },
                    required: ["origin"]
                }
            },
            {
                name: "get_popular_names",
                description: "Retrieve currently popular Arabic names with trending information. Can filter by gender and popularity trend.",
                inputSchema: {
                    type: "object",
                    properties: {
                        gender: {
                            type: "string",
                            enum: ["MALE", "FEMALE", "UNISEX"],
                            description: "Filter by gender"
                        },
                        trend: {
                            type: "string",
                            enum: ["RISING", "FALLING", "STABLE", "NEW", "DECLINING", "CLASSIC"],
                            description: "Filter by popularity trend"
                        },
                        limit: {
                            type: "number",
                            description: "Maximum results to return (default: 20)",
                            minimum: 1,
                            maximum: 50,
                            default: 20
                        }
                    }
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case "get_name_details": {
            const { nameId } = args;
            if (!nameId) {
                throw new Error("nameId is required");
            }

            const result = await handleOperation(async () => {
                const response = await esClient.get({
                    index: NAMES_INDEX,
                    id: nameId
                });

                if (response.found) {
                    return {
                        found: true,
                        data: response._source
                    };
                } else {
                    return {
                        found: false,
                        message: `Name with ID ${nameId} not found`
                    };
                }
            });

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
            };
        }

        case "save_name_research": {
            const nameDetails = args;
            if (!nameDetails.arabic) {
                throw new Error("Arabic name is required");
            }

            if (nameDetails.status != "SUCCESS" && nameDetails.status != "INVALID") {
                throw new Error("Invalid Status , use SUCCESS or INVALID");
            }

            const now = new Date().toISOString();

            // Generate slug from transliteration
            const slug = transliterationToSlug(nameDetails.transliteration);

            // Use slug as ID if not provided, otherwise use existing ID
            const recordId = nameDetails.id || slug;

            await handleOperation(async () => {
                let createdAt = now;
                let createdBy = "system";

                if (recordId) {
                    try {
                        const response = await esClient.get({
                            index: NAMES_INDEX,
                            id: recordId,
                            _source_includes: ["createdAt", "createdBy"]
                        });
                        if (response.found && response._source) {
                            if (response._source.createdAt) {
                                createdAt = response._source.createdAt;
                            }
                            if (response._source.createdBy) {
                                createdBy = response._source.createdBy;
                            }
                        }
                    } catch (error) {
                        // If not found, it's a new document, defaults are fine.
                        // Log other errors if necessary but don't fail the save.
                        if (error.meta && error.meta.statusCode !== 404) {
                            console.warn(`Audit field retrieval for ${recordId} failed: ${error.message}`);
                        }
                    }
                }

                const completeNameData = {
                    ...nameDetails,
                    id: recordId,
                    slug: slug,
                    lastUpdated: now, // existing field, keep it consistent with updatedAt
                    processDate: nameDetails.processDate || now, // existing field
                    updatedAt: now, // new audit field
                    updatedBy: "system", // new audit field
                    createdAt: createdAt, // new audit field (conditionally set)
                    createdBy: createdBy  // new audit field (conditionally set)
                };

                await esClient.index({
                    index: NAMES_INDEX,
                    id: recordId, // id is critical for create vs update
                    body: completeNameData,
                    refresh: 'wait_for'
                });
            });

            // Process additional names from exploreMoreNames and relatedNames
            const additionalNames = [];

            if (nameDetails.exploreMoreNames) {
                additionalNames.push(...nameDetails.exploreMoreNames);
            }

            if (nameDetails.relatedNames) {
                additionalNames.push(...nameDetails.relatedNames);
            }

            let addedCount = 0;
            for (const nameEntry of additionalNames) {
                if (nameEntry.name && nameEntry.transliteration) {
                    const slug = transliterationToSlug(nameEntry.transliteration);

                    try {
                        await handleOperation(async () => {
                            const searchResponse = await esClient.search({
                                index: NAMES_INDEX,
                                body: {
                                    query: {
                                        bool: {
                                            should: [
                                                { term: { "arabic.keyword": nameEntry.name } },
                                                { term: { "slug": slug } }
                                            ]
                                        }
                                    },
                                    size: 1
                                }
                            });

                            if (searchResponse.hits.total.value === 0) {
                                // Generate slug-based ID if transliteration is provided, otherwise use random ID

                                const newNameData = {
                                    id: slug,
                                    arabic: nameEntry.name,
                                    transliteration: nameEntry.transliteration || "",
                                    slug: slug,
                                    brief_meaning: nameEntry.brief_meaning || "",
                                    status: "NEW",
                                    priority: "MEDIUM",
                                    processDate: new Date().toISOString(),
                                    source: `Related to ${nameDetails.arabic}`
                                };

                                await esClient.index({
                                    index: NAMES_INDEX,
                                    id: slug,
                                    body: newNameData,
                                    refresh: 'wait_for'
                                });
                                addedCount++;
                            }
                        });
                    } catch (error) {
                        console.error(`Failed to add name "${nameEntry.name}":`, error.message);
                    }
                }
            }

            return {
                content: [{
                    type: "text",
                    text: `✅ Name research saved successfully!\n\nName: ${nameDetails.arabic} (${nameDetails.transliteration})\nID: ${recordId}\nSlug: ${slug}\nAdded ${addedCount} new names to research queue.\n\nSummary:\n- Meaning: ${nameDetails.meaning}\n- Origin: ${nameDetails.origin}\n- Gender: ${nameDetails.gender}\n- Status: ${nameDetails.status}`
                }]
            };
        }

        case "get_pending_names": {
            const { limit = 10 } = args;

            const result = await handleOperation(async () => {
                const response = await esClient.search({
                    index: NAMES_INDEX,
                    body: {
                        query: {
                            term: { "status": "NEW" }
                        },
                        sort: [{ "processDate": { "order": "asc" } }],
                        size: Math.min(limit, 50),
                        _source: ["arabic", "transliteration", "status", "id", "processDate", "priority", "source", "brief_meaning"]
                    }
                });

                return {
                    total_pending: response.hits.total.value,
                    returned: response.hits.hits.length,
                    names: response.hits.hits.map(hit => ({
                        id: hit._source.id || hit._id,
                        arabic: hit._source.arabic || "",
                        transliteration: hit._source.transliteration || "",
                        status: hit._source.status || "NEW",
                        priority: hit._source.priority || "MEDIUM",
                        processDate: hit._source.processDate,
                        source: hit._source.source || "",
                        brief_meaning: hit._source.brief_meaning || ""
                    }))
                };
            });

            return {
                content: [{
                    type: "text",
                    text: `📋 Pending Names for Research\n\nTotal pending: ${result.total_pending}\nShowing: ${result.returned}\n\n${JSON.stringify(result, null, 2)}`
                }]
            };
        }

        case "search_names": {
            const { query, gender, origin, status, limit = 20 } = args;

            const result = await handleOperation(async () => {
                const searchBody = {
                    query: {
                        bool: {
                            must: [
                                {
                                    multi_match: {
                                        query: query,
                                        fields: ["arabic^3", "transliteration^2", "meaning", "description"],
                                        fuzziness: "AUTO"
                                    }
                                }
                            ],
                            filter: []
                        }
                    },
                    size: Math.min(limit, 100),
                    _source: ["arabic", "transliteration", "meaning", "origin", "gender", "status", "id", "popularityRank"]
                };

                if (gender) {
                    searchBody.query.bool.filter.push({ term: { gender } });
                }
                if (origin) {
                    searchBody.query.bool.filter.push({ term: { "origin.keyword": origin } });
                }
                if (status) {
                    searchBody.query.bool.filter.push({ term: { status } });
                }

                const response = await esClient.search({
                    index: NAMES_INDEX,
                    body: searchBody
                });

                return {
                    total: response.hits.total.value,
                    returned: response.hits.hits.length,
                    results: response.hits.hits.map(hit => ({
                        id: hit._source.id || hit._id,
                        arabic: hit._source.arabic,
                        transliteration: hit._source.transliteration,
                        meaning: hit._source.meaning,
                        origin: hit._source.origin,
                        gender: hit._source.gender,
                        status: hit._source.status,
                        popularity: hit._source.popularityRank,
                        score: hit._score
                    }))
                };
            });

            return {
                content: [{
                    type: "text",
                    text: `🔍 Search Results for "${query}"\n\nFound: ${result.total} names\nShowing: ${result.returned}\n\n${JSON.stringify(result, null, 2)}`
                }]
            };
        }

        case "get_name_statistics": {
            const { detailed = false } = args;

            const result = await handleOperation(async () => {
                const stats = {};

                // Total count
                const totalResponse = await esClient.count({
                    index: NAMES_INDEX
                });
                stats.total_names = totalResponse.count;

                // Status distribution
                const statusAgg = await esClient.search({
                    index: NAMES_INDEX,
                    body: {
                        size: 0,
                        aggs: {
                            status_distribution: {
                                terms: { field: "status" }
                            }
                        }
                    }
                });
                stats.status_distribution = statusAgg.aggregations.status_distribution.buckets;

                // Gender distribution
                const genderAgg = await esClient.search({
                    index: NAMES_INDEX,
                    body: {
                        size: 0,
                        aggs: {
                            gender_distribution: {
                                terms: { field: "gender" }
                            }
                        }
                    }
                });
                stats.gender_distribution = genderAgg.aggregations.gender_distribution.buckets;

                if (detailed) {
                    // Origin distribution
                    const originAgg = await esClient.search({
                        index: NAMES_INDEX,
                        body: {
                            size: 0,
                            aggs: {
                                origin_distribution: {
                                    terms: { field: "origin.keyword", size: 20 }
                                }
                            }
                        }
                    });
                    stats.origin_distribution = originAgg.aggregations.origin_distribution.buckets;

                    // Popularity trends
                    const trendAgg = await esClient.search({
                        index: NAMES_INDEX,
                        body: {
                            size: 0,
                            aggs: {
                                popularity_trends: {
                                    terms: { field: "popularityTrend" }
                                }
                            }
                        }
                    });
                    stats.popularity_trends = trendAgg.aggregations.popularity_trends.buckets;
                }

                return stats;
            });

            return {
                content: [{
                    type: "text",
                    text: `📊 Arabic Names Database Statistics\n\n${JSON.stringify(result, null, 2)}`
                }]
            };
        }

        case "find_similar_names": {
            const { arabicName, similarityType = "all", limit = 15 } = args;

            const result = await handleOperation(async () => {
                const searchBody = {
                    query: {
                        bool: {
                            should: [],
                            must_not: [
                                { term: { "arabic.keyword": arabicName } }
                            ]
                        }
                    },
                    size: Math.min(limit, 30),
                    _source: ["arabic", "transliteration", "meaning", "origin", "gender", "id", "linguisticRoot"]
                };

                if (similarityType === "all" || similarityType === "phonetic") {
                    searchBody.query.bool.should.push({
                        fuzzy: {
                            arabic: {
                                value: arabicName,
                                fuzziness: 2
                            }
                        }
                    });
                }

                if (similarityType === "all" || similarityType === "meaning") {
                    searchBody.query.bool.should.push({
                        more_like_this: {
                            fields: ["meaning", "description"],
                            like: arabicName,
                            min_term_freq: 1,
                            max_query_terms: 12
                        }
                    });
                }

                const response = await esClient.search({
                    index: NAMES_INDEX,
                    body: searchBody
                });

                return {
                    search_for: arabicName,
                    similarity_type: similarityType,
                    found: response.hits.hits.length,
                    similar_names: response.hits.hits.map(hit => ({
                        id: hit._source.id || hit._id,
                        arabic: hit._source.arabic,
                        transliteration: hit._source.transliteration,
                        meaning: hit._source.meaning,
                        origin: hit._source.origin,
                        gender: hit._source.gender,
                        linguistic_root: hit._source.linguisticRoot,
                        similarity_score: hit._score
                    }))
                };
            });

            return {
                content: [{
                    type: "text",
                    text: `🔗 Names Similar to "${arabicName}"\n\nSimilarity Type: ${similarityType}\nFound: ${result.found} similar names\n\n${JSON.stringify(result, null, 2)}`
                }]
            };
        }

        case "add_name_to_research_queue": {
            const { arabicName, transliteration, priority = "MEDIUM", source = "", notes = "" } = args;
            const slug = transliterationToSlug(transliteration);

            if (!arabicName || !transliteration) {
                return {
                    success: false,
                    message: "Invlid call , please define arabicName & transliteration args",
                    existing_name: existingResponse.hits.hits[0]._source
                };
            }

            const result = await handleOperation(async () => {
                // Check if name already exists
                const existingResponse = await esClient.search({
                    index: NAMES_INDEX,
                    body: {
                        query: {
                            bool: {
                                should: [
                                    { term: { "arabic.keyword": arabicName } },
                                    { term: { "slug": slug } }
                                ]
                            }
                        },
                        size: 1
                    }
                });

                if (existingResponse.hits.total.value > 0) {
                    return {
                        success: false,
                        message: "Name already exists in database",
                        existing_name: existingResponse.hits.hits[0]._source
                    };
                }


                const newNameData = {
                    id: slug,
                    arabic: arabicName,
                    transliteration: transliteration,
                    slug: slug,
                    status: "NEW",
                    priority: priority,
                    processDate: new Date().toISOString(),
                    source: source,
                    notes: notes
                };

                await esClient.index({
                    index: NAMES_INDEX,
                    id: slug,
                    body: newNameData,
                    refresh: 'wait_for'
                });

                return {
                    success: true,
                    message: "Name added to research queue successfully",
                    name_data: newNameData
                };
            });

            return {
                content: [{
                    type: "text",
                    text: result.success
                        ? `✅ Added "${arabicName}" to research queue\n\nID: ${result.name_data.id}\nSlug: ${result.name_data.slug || 'N/A'}\nPriority: ${priority}\nStatus: NEW`
                        : `❌ ${result.message}\n\nExisting name: ${result.existing_name?.arabic} (${result.existing_name?.transliteration})`
                }]
            };
        }

        case "get_names_by_origin": {
            const { origin, gender, limit = 25, includeDetails = false } = args;

            const result = await handleOperation(async () => {
                const searchBody = {
                    query: {
                        bool: {
                            must: [
                                { term: { "origin.keyword": origin } }
                            ]
                        }
                    },
                    size: Math.min(limit, 100),
                    _source: includeDetails ? true : ["arabic", "transliteration", "meaning", "origin", "gender", "id", "status"]
                };

                if (gender) {
                    searchBody.query.bool.must.push({ term: { gender } });
                }

                const response = await esClient.search({
                    index: NAMES_INDEX,
                    body: searchBody
                });

                return {
                    origin: origin,
                    gender_filter: gender || "all",
                    total_found: response.hits.total.value,
                    returned: response.hits.hits.length,
                    names: response.hits.hits.map(hit => includeDetails ? hit._source : {
                        id: hit._source.id || hit._id,
                        arabic: hit._source.arabic,
                        transliteration: hit._source.transliteration,
                        meaning: hit._source.meaning,
                        origin: hit._source.origin,
                        gender: hit._source.gender,
                        status: hit._source.status
                    })
                };
            });

            return {
                content: [{
                    type: "text",
                    text: `🌍 Names from ${origin} Origin\n\nGender Filter: ${gender || 'All'}\nFound: ${result.total_found}\nShowing: ${result.returned}\n\n${JSON.stringify(result, null, 2)}`
                }]
            };
        }

        case "get_popular_names": {
            const { gender, trend, limit = 20 } = args;

            const result = await handleOperation(async () => {
                const searchBody = {
                    query: {
                        bool: {
                            must: [
                                { exists: { field: "popularityRank" } }
                            ],
                            filter: []
                        }
                    },
                    sort: [
                        { "popularityRank": { "order": "asc" } }
                    ],
                    size: Math.min(limit, 50),
                    _source: ["arabic", "transliteration", "meaning", "gender", "popularityRank", "popularityTrend", "id", "origin"]
                };

                if (gender) {
                    searchBody.query.bool.filter.push({ term: { gender } });
                }
                if (trend) {
                    searchBody.query.bool.filter.push({ term: { popularityTrend: trend } });
                }

                const response = await esClient.search({
                    index: NAMES_INDEX,
                    body: searchBody
                });

                return {
                    filters: {
                        gender: gender || "all",
                        trend: trend || "all"
                    },
                    total_popular_names: response.hits.total.value,
                    returned: response.hits.hits.length,
                    popular_names: response.hits.hits.map(hit => ({
                        id: hit._source.id || hit._id,
                        arabic: hit._source.arabic,
                        transliteration: hit._source.transliteration,
                        meaning: hit._source.meaning,
                        gender: hit._source.gender,
                        origin: hit._source.origin,
                        popularity_rank: hit._source.popularityRank,
                        trend: hit._source.popularityTrend
                    }))
                };
            });

            return {
                content: [{
                    type: "text",
                    text: `🌟 Popular Arabic Names\n\nFilters: Gender=${gender || 'All'}, Trend=${trend || 'All'}\nFound: ${result.total_popular_names}\nShowing: ${result.returned}\n\n${JSON.stringify(result, null, 2)}`
                }]
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

        // Create index mapping if it doesn't exist
        try {
            const indexExists = await esClient.indices.exists({ index: NAMES_INDEX });
            if (!indexExists) {
                await esClient.indices.create({
                    index: NAMES_INDEX,
                    body: {
                        mappings: {
                            properties: {
                                "slug": {
                                    "type": "keyword",
                                    "index": true
                                },
                                arabic: {
                                    type: "text",
                                    fields: { keyword: { type: "keyword" } },
                                    analyzer: "arabic"
                                },
                                transliteration: {
                                    type: "text",
                                    fields: { keyword: { type: "keyword" } }
                                },
                                meaning: { type: "text", analyzer: "arabic" },
                                origin: {
                                    type: "text",
                                    fields: { keyword: { type: "keyword" } }
                                },
                                gender: { type: "keyword" },
                                status: { type: "keyword" },
                                priority: { type: "keyword" },
                                popularityRank: { "type": "keyword" },
                                popularityTrend: { type: "keyword" },
                                processDate: { type: "date" },
                                lastUpdated: { type: "date" },
                                linguisticRoot: {
                                    type: "text",
                                    fields: { keyword: { type: "keyword" } }
                                },
                                numerologyValue: { "type": "keyword" },
                                numerologyMeaning: { "type": "text", "analyzer": "arabic" },
                                nameDay: { "type": "text" },
                                seasonalAssociation: { "type": "text" },
                                colorAssociation: { "type": "text" },
                                gemstoneAssociation: { "type": "text" },
                                famousPersons: {
                                    "type": "nested",
                                    "properties": {
                                        "name": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "description": { "type": "text", "analyzer": "arabic" },
                                        "period": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "field": { "type": "text", "fields": { "keyword": { "type": "keyword" } } }
                                    }
                                },
                                variations: {
                                    "type": "nested",
                                    "properties": {
                                        "variation": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "type": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "region": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "script": { "type": "text", "fields": { "keyword": { "type": "keyword" } } }
                                    }
                                },
                                personality: {
                                    "type": "object",
                                    "properties": {
                                        "traits": { "type": "keyword" },
                                        "strengths": { "type": "keyword" },
                                        "characteristics": { "type": "text", "analyzer": "arabic" }
                                    }
                                },
                                compatibility: {
                                    "type": "object",
                                    "properties": {
                                        "compatibleNames": { "type": "keyword" },
                                        "compatibleSigns": { "type": "keyword" },
                                        "recommendation": { "type": "text", "analyzer": "arabic" }
                                    }
                                },
                                relatedNames: {
                                    "type": "nested",
                                    "properties": {
                                        "name": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "transliteration": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "relationship": { "type": "text", "fields": { "keyword": { "type": "keyword" } } }
                                    }
                                },
                                exploreMoreNames: {
                                    "type": "nested",
                                    "properties": {
                                        "name": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "transliteration": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "brief_meaning": { "type": "text", "analyzer": "arabic" }
                                    }
                                },
                                literaryReferences: {
                                    "type": "nested",
                                    "properties": {
                                        "work": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "author": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "character": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "context": { "type": "text", "analyzer": "arabic" },
                                        "period": { "type": "text", "fields": { "keyword": { "type": "keyword" } } }
                                    }
                                },
                                alternativeSpellings: {
                                    "type": "nested",
                                    "properties": {
                                        "spelling": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "script": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "region": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                                        "frequency": { "type": "text", "fields": { "keyword": { "type": "keyword" } } }
                                    }
                                },
                                createdAt: { "type": "date" },
                                updatedAt: { "type": "date" },
                                createdBy: { "type": "keyword" },
                                updatedBy: { "type": "keyword" },
                                id: { "type": "keyword" }, // For querying the ID field itself
                                description: { type: "text", analyzer: "arabic" },
                                culturalSignificance: { type: "text", analyzer: "arabic" },
                                etymology: { type: "text", analyzer: "arabic" },
                                historicalContext: { type: "text", analyzer: "arabic" },
                                religiousSignificance: { type: "text", analyzer: "arabic" },
                                modernUsage: { type: "text", analyzer: "arabic" },
                                symbolism: { type: "text", analyzer: "arabic" },
                                pronunciationIpa: { type: "text" },
                                pronunciationGuide: { type: "text", analyzer: "arabic" },
                                source: { type: "text" },
                                notes: { type: "text" }
                            }
                        },
                        settings: {
                            analysis: {
                                analyzer: {
                                    arabic: {
                                        tokenizer: "standard",
                                        filter: ["lowercase", "arabic_normalization", "arabic_stem"]
                                    }
                                }
                            }
                        }
                    }
                });
                console.error('Created new index with proper mappings');
            }
        } catch (indexError) {
            console.error('Index creation warning:', indexError.message);
        }

        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('Arabic Names Explorer MCP Server v2.0 started successfully');
        console.error('Enhanced with 9 powerful tools for comprehensive Arabic name research');

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});