// After pack script for electron-builder
// This script rebuilds native modules for the target platform

const { execSync } = require('child_process')
const path = require('path')

exports.default = async function (context) {
  const { appOutDir, packager, electronVersion, arch } = context

  console.log('After pack hook triggered')
  console.log('Output directory:', appOutDir)
  console.log('Electron version:', electronVersion)
  console.log('Architecture:', arch)

  // Rebuild native modules if needed
  if (process.platform === 'win32') {
    try {
      console.log('Rebuilding native modules...')
      execSync('npm rebuild better-sqlite3', {
        cwd: appOutDir,
        stdio: 'inherit'
      })
      console.log('Native modules rebuilt successfully')
    } catch (error) {
      console.error('Error rebuilding native modules:', error)
      // Don't throw - this is optional
    }
  }
}
