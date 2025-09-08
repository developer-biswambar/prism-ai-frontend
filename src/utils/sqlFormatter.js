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
        'GROUP BY', 'ORDER BY', 'HAVING', 'UNION', 'UNION ALL', 'WITH', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'
    ];

    // Handle complex patterns first
    
    // Handle WITH clauses (CTEs) - preserve structure
    formatted = formatted.replace(/\bWITH\b/gi, '\nWITH');
    formatted = formatted.replace(/,\s*(\w+)\s+AS\s*\(/gi, ',\n$1 AS (');
    
    // Handle CASE statements properly
    formatted = formatted.replace(/\bCASE\s+WHEN\b/gi, '\nCASE\n    WHEN');
    formatted = formatted.replace(/\bWHEN\b/gi, '\n    WHEN');
    formatted = formatted.replace(/\bTHEN\b/gi, ' THEN');
    formatted = formatted.replace(/\bELSE\b/gi, '\n    ELSE');
    formatted = formatted.replace(/\bEND\b/gi, '\nEND');
    
    // Handle subqueries and nested structures
    formatted = formatted.replace(/\(\s*SELECT\b/gi, '(\n    SELECT');
    formatted = formatted.replace(/\)\s+(FROM|WHERE|GROUP BY|ORDER BY|UNION|,)/gi, '\n) $1');
    
    // Better JOIN handling
    formatted = formatted.replace(/\b(INNER|LEFT|RIGHT|FULL OUTER)\s+JOIN\b/gi, '\n$1 JOIN');
    formatted = formatted.replace(/\bJOIN\b/gi, '\nJOIN');
    formatted = formatted.replace(/\bON\b/gi, '\n    ON');
    
    // Handle AND/OR in WHERE clauses with proper indentation
    formatted = formatted.replace(/\s+(AND|OR)\s+/gi, '\n    $1 ');

    // Replace other keywords with newlines
    const simpleKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'UNION', 'UNION ALL'];
    simpleKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        formatted = formatted.replace(regex, `\n${keyword}`);
    });
    
    // Better comma handling for SELECT columns
    formatted = formatted.replace(/\nSELECT\s+([^\n]+)/gi, (match, columns) => {
        const columnList = columns.split(',').map(col => col.trim());
        if (columnList.length > 1) {
            return '\nSELECT\n    ' + columnList.join(',\n    ');
        }
        return match;
    });

    // Split into lines for processing
    let lines = formatted.split('\n');
    let indentLevel = 0;
    const indentSize = '    '; // 4 spaces
    const indentKeywords = ['ON', 'AND', 'OR', 'WHEN', 'THEN', 'ELSE'];

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