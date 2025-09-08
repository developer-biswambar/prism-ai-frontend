/**
 * Simple SQL formatter for better readability in UI
 * Formats SQL queries with proper indentation and line breaks
 */

export const formatSQL = (sql) => {
    if (!sql || typeof sql !== 'string') {
        return sql;
    }

    // Remove extra whitespace and normalize
    let formatted = sql.trim().replace(/\s+/g, ' ');

    // Keywords that should start on new lines
    const newLineKeywords = [
        'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN',
        'GROUP BY', 'ORDER BY', 'HAVING', 'UNION', 'UNION ALL', 'WITH', 'AND', 'OR'
    ];

    // Keywords that should be indented
    const indentKeywords = [
        'WHERE', 'AND', 'OR', 'GROUP BY', 'ORDER BY', 'HAVING'
    ];

    // Replace keywords with newline + keyword
    newLineKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        formatted = formatted.replace(regex, `\n${keyword}`);
    });

    // Handle WITH clauses specially (CTEs)
    formatted = formatted.replace(/\bWITH\b/gi, '\nWITH');
    formatted = formatted.replace(/\bAS\s*\(/gi, ' AS (\n    ');

    // Handle subqueries in parentheses
    formatted = formatted.replace(/\(\s*(SELECT)/gi, '(\n    $1');
    formatted = formatted.replace(/\)\s*(FROM|WHERE|GROUP|ORDER|UNION)/gi, '\n) $1');
    
    // Better comma handling for SELECT columns (split long column lists)
    formatted = formatted.replace(/SELECT\s+([^FROM]+)/gi, (match, columns) => {
        if (columns.length > 80) { // Only split if line is long
            const columnList = columns.split(',').map(col => col.trim());
            if (columnList.length > 3) {
                return 'SELECT\n    ' + columnList.join(',\n    ');
            }
        }
        return match;
    });

    // Split into lines for processing
    let lines = formatted.split('\n');
    let indentLevel = 0;
    const indentSize = '    '; // 4 spaces

    lines = lines.map((line, index) => {
        line = line.trim();
        if (!line) return '';

        // Decrease indent for closing parentheses
        if (line.match(/^\)/)) {
            indentLevel = Math.max(0, indentLevel - 1);
        }

        // Apply current indentation
        let indentedLine = indentSize.repeat(indentLevel) + line;

        // Increase indent after opening parentheses or certain keywords
        if (line.match(/\($/) || line.match(/\bWITH\b/i)) {
            indentLevel++;
        }

        // Special indentation for certain keywords
        if (indentKeywords.some(keyword => line.toUpperCase().startsWith(keyword))) {
            if (indentLevel === 0) {
                indentedLine = indentSize + line;
            }
        }

        return indentedLine;
    });

    // Clean up multiple empty lines
    formatted = lines.join('\n').replace(/\n\s*\n\s*\n/g, '\n\n');

    // Final cleanup
    formatted = formatted.trim();

    return formatted;
};

/**
 * Format SQL with syntax highlighting classes (for future enhancement)
 */
export const formatSQLWithHighlighting = (sql) => {
    const formatted = formatSQL(sql);
    
    // This is a simple version - could be enhanced with proper syntax highlighting
    return formatted
        .replace(/\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|GROUP BY|ORDER BY|HAVING|WITH|AS|AND|OR|UNION|ALL)\b/g, 
                '<span class="sql-keyword">$1</span>')
        .replace(/\b(COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END|CAST|EXTRACT|COALESCE)\b/g, 
                '<span class="sql-function">$1</span>')
        .replace(/'([^']*)'/g, '<span class="sql-string">\'$1\'</span>')
        .replace(/\b(\d+)\b/g, '<span class="sql-number">$1</span>');
};

/**
 * Simple SQL minifier (opposite of formatter) - removes extra whitespace
 */
export const minifySQL = (sql) => {
    if (!sql || typeof sql !== 'string') {
        return sql;
    }
    
    return sql
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s*\(\s*/g, '(')
        .replace(/\s*\)\s*/g, ')')
        .trim();
};