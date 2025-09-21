const fs = require('fs');
const path = require('path');

class QueryLoader {
  constructor() {
    this.persistedQueries = new Map();
    this.loadPersistedQueries();
  }

  loadPersistedQueries() {
    const persistedDir = path.join(__dirname, '../../persisted');
    
    if (!fs.existsSync(persistedDir)) {
      console.warn('Persisted queries directory not found');
      return;
    }

    const files = fs.readdirSync(persistedDir).filter(file => file.endsWith('.json'));
    
    files.forEach(file => {
      try {
        const filePath = path.join(persistedDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const queryData = JSON.parse(content);
        
        // Use filename without extension as query ID
        const queryId = path.basename(file, '.json');
        this.persistedQueries.set(queryId, queryData);
        
        console.log(`Loaded persisted query: ${queryId}`);
      } catch (error) {
        console.error(`Error loading persisted query ${file}:`, error.message);
      }
    });
  }

  getPersistedQuery(queryId) {
    return this.persistedQueries.get(queryId);
  }

  getAllPersistedQueries() {
    return Array.from(this.persistedQueries.entries()).map(([id, data]) => ({
      id,
      description: data.description,
      allowedRoles: data.allowedRoles
    }));
  }

  isQueryAllowed(queryString, userRoles = []) {
    // In demo mode, only allow persisted queries
    if (process.env.DEMO_MODE === 'true') {
      // Check if this query matches any persisted query
      for (const [queryId, queryData] of this.persistedQueries) {
        if (this.queriesMatch(queryString, queryData.query)) {
          // Check if user has required role
          return this.hasRequiredRole(userRoles, queryData.allowedRoles);
        }
      }
      return false;
    }
    
    // In non-demo mode, allow all queries (but still check roles if specified)
    return true;
  }

  queriesMatch(query1, query2) {
    // Simple normalization - remove whitespace and compare
    const normalize = (q) => q.replace(/\s+/g, ' ').trim();
    return normalize(query1) === normalize(query2);
  }

  hasRequiredRole(userRoles, allowedRoles) {
    if (!allowedRoles || allowedRoles.length === 0) {
      return true; // No role restrictions
    }
    
    if (!userRoles || userRoles.length === 0) {
      return false; // User has no roles but roles are required
    }
    
    return userRoles.some(role => allowedRoles.includes(role));
  }

  validateQuery(queryString, variables = {}, userRoles = []) {
    if (!this.isQueryAllowed(queryString, userRoles)) {
      throw new Error('Query not allowed in demo mode or insufficient permissions');
    }
    
    return true;
  }
}

module.exports = QueryLoader;
