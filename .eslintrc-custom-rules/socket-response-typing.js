/**
 * @fileoverview Rule to enforce consistent socket response typing
 */
"use strict";

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce typed socket responses instead of string literals",
      category: "TypeScript",
      recommended: true,
    },
    fixable: "code",
    schema: []
  },

  create: function(context) {
    return {
      // Match functions that emit socket events and return string literals
      "ReturnStatement > Literal": function(node) {
        const functionNode = findParentFunction(node);
        if (!functionNode) return;

        const functionName = getFunctionName(functionNode);
        if (!functionName) return;

        // Check if this function is socket-related by name
        if (isSocketRelatedFunction(functionName) && node.value && typeof node.value === "string") {
          context.report({
            node,
            message: "Socket-related methods should return typed objects instead of string literals",
            fix: function(fixer) {
              return fixer.replaceText(node, `{ 
                success: true, 
                message: ${JSON.stringify(node.value)}, 
                timestamp: new Date().toISOString() 
              }`);
            }
          });
        }
      }
    };
  }
};

function findParentFunction(node) {
  let current = node;
  while (current) {
    if (current.type === "FunctionDeclaration" || 
        current.type === "FunctionExpression" || 
        current.type === "ArrowFunctionExpression") {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function getFunctionName(node) {
  if (node.id && node.id.name) {
    return node.id.name;
  } else if (node.parent && node.parent.key && node.parent.key.name) {
    return node.parent.key.name;
  }
  return null;
}

function isSocketRelatedFunction(name) {
  const socketPatterns = [
    "emit", "socket", "event", "broadcast", "publish", "send", "message", "notify"
  ];
  return socketPatterns.some(pattern => name.toLowerCase().includes(pattern.toLowerCase()));
}
