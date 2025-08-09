import edfiService from './services/edfiService';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Starting Ed-Fi synchronization...\n');
  
  console.log('Configuration:');
  console.log('- Ed-Fi Base URL:', process.env.EDFI_BASE_URL || 'http://localhost:8001');
  console.log('- Client ID:', process.env.EDFI_CLIENT_ID || 'populatedKey');
  console.log('\n');

  try {
    console.log('Testing Ed-Fi connection...');
    const isConnected = await edfiService.testConnection();
    
    if (!isConnected) {
      console.error('Failed to connect to Ed-Fi. Please check your configuration.');
      process.exit(1);
    }

    const args = process.argv.slice(2);
    const syncType = args[0] || 'all';

    switch (syncType) {
      case 'schools':
        await edfiService.syncAllSchools();
        break;
      case 'students':
        await edfiService.syncAllStudents();
        break;
      case 'courses':
        await edfiService.syncAllCourses();
        break;
      case 'sections':
        await edfiService.syncAllCourseSections();
        break;
      case 'grades':
        await edfiService.syncAllGrades();
        break;
      case 'all':
        await edfiService.syncAll();
        break;
      default:
        console.log(`Unknown sync type: ${syncType}`);
        console.log('Usage: npm run sync-edfi [all|schools|students|courses|sections|grades]');
        process.exit(1);
    }

    console.log('\n✅ Synchronization completed successfully!');
  } catch (error) {
    console.error('\n❌ Synchronization failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);