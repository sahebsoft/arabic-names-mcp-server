#!/usr/bin/env node

import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

class MCPTester {
  constructor() {
    this.serverProcess = null;
  }

  async startServer() {
    console.log('🚀 Starting MCP server...');
    this.serverProcess = spawn('node', ['index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle server errors
    this.serverProcess.stderr.on('data', (data) => {
      console.log(`Server: ${data.toString().trim()}`);
    });

    this.serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
    });

    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async sendRequest(request) {
    return new Promise((resolve, reject) => {
      let response = '';
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      this.serverProcess.stdout.once('data', (data) => {
        clearTimeout(timeout);
        try {
          response = data.toString();
          resolve(JSON.parse(response));
        } catch (error) {
          reject(new Error(`Failed to parse response: ${response}`));
        }
      });

      // Send request
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async testListTools() {
    console.log('\n📝 Testing list_tools...');
    
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list"
    };

    try {
      const response = await this.sendRequest(request);
      console.log('✅ List tools response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('❌ List tools failed:', error.message);
    }
  }

  async testReadName(nameId = null) {
    console.log('\n📖 Testing read-name...');
    
    const testId = nameId || uuidv4();
    const request = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "read-name",
        arguments: {
          nameId: testId
        }
      }
    };

    try {
      const response = await this.sendRequest(request);
      console.log('✅ Read name response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('❌ Read name failed:', error.message);
    }
  }

  async testSubmitName() {
    console.log('\n💾 Testing submit-name-details...');
    
    const request = {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "submit-name-details",
        arguments: {
          arabic: "محمد",
          transliteration: "Muhammad",
          meaning: "المحمود والممدوح، من يُحمد على أعماله الطيبة",
          origin: "عربي",
          gender: "MALE",
          description: "اسم النبي محمد صلى الله عليه وسلم، وهو من أشهر الأسماء في العالم الإسلامي",
          culturalSignificance: "اسم النبي محمد له مكانة عظيمة في الثقافة الإسلامية والعربية",
          famousPersons: [
            {
              name: "النبي محمد صلى الله عليه وسلم",
              description: "رسول الله وخاتم الأنبياء",
              period: "571-632 م"
            }
          ],
          variations: [
            {
              variation: "أحمد",
              type: "مرادف",
              region: "العالم العربي"
            }
          ],
          etymology: "من الجذر الثلاثي ح-م-د، بمعنى الحمد والثناء",
          linguisticRoot: "ح-م-د",
          numerologyValue: "92",
          numerologyMeaning: "رقم القيادة والإلهام",
          personality: {
            traits: ["قيادي", "محبوب", "موثوق"],
            strengths: ["الحكمة", "العدالة", "الرحمة"],
            characteristics: "شخصية قيادية محبوبة تتمتع بالحكمة والعدالة"
          },
          compatibility: {
            compatibleNames: ["عائشة", "فاطمة", "علي"],
            compatibleSigns: ["الأسد", "الميزان"],
            recommendation: "يتوافق مع الأسماء ذات المعاني الإيجابية"
          },
          historicalContext: "اسم يحمل تاريخاً عريقاً منذ البعثة النبوية",
          religiousSignificance: "اسم النبي محمد صلى الله عليه وسلم",
          modernUsage: "من أكثر الأسماء استخداماً في العالم الإسلامي",
          pronunciationIpa: "/mu.ħam.mad/",
          pronunciationGuide: "مُحَمَّد",
          relatedNames: [
            {
              name: "أحمد",
              transliteration: "Ahmad",
              relationship: "مرادف"
            }
          ],
          exploreMoreNames: [
            {
              name: "علي",
              transliteration: "Ali"
            }
          ],
          popularityRank: "1",
          popularityTrend: "STABLE",
          symbolism: "رمز للقيادة والحكمة والرحمة"
        }
      }
    };

    try {
      const response = await this.sendRequest(request);
      console.log('✅ Submit name response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('❌ Submit name failed:', error.message);
    }
  }

  async runTests() {
    try {
      await this.startServer();
      
      // Test sequence
      await this.testListTools();
      await this.testReadName();
      await this.testSubmitName();
      
      console.log('\n🎉 All tests completed!');
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      this.cleanup();
    }
  }

  cleanup() {
    if (this.serverProcess) {
      console.log('\n🛑 Stopping server...');
      this.serverProcess.kill();
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new MCPTester();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    tester.cleanup();
    process.exit(0);
  });
  
  tester.runTests();
}