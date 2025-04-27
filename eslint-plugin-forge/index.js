/**
 * Custom ESLint rules for ForgeBoard
 */
module.exports = {
  rules: {
    // Socket cleanup rule
    'socket-cleanup-rule': require('./socket-cleanup-rule'),
    
    // Non-standalone components rule
    'require-non-standalone-components': {
      meta: {
        type: "problem",
        docs: {
          description: "Enforce non-standalone components by requiring standalone: false",
          category: "Best Practices",
          recommended: true
        },
        fixable: "code",
        schema: [] // no options
      },
      create: function(context) {
        return {
          // Find decorator expressions that look like @Component(...)
          "Decorator[expression.callee.name='Component']": function(node) {
            var decoratorArgument = node.expression.arguments[0];
            
            // Only check object literals
            if (decoratorArgument && decoratorArgument.type === "ObjectExpression") {
              var standaloneProperty = decoratorArgument.properties.find(
                function(property) {
                  return property.key && 
                    property.key.type === "Identifier" && 
                    property.key.name === "standalone";
                }
              );
              
              // If standalone property doesn't exist
              if (!standaloneProperty) {
                context.report({
                  node: decoratorArgument,
                  message: "Component must have standalone: false explicitly set",
                  fix: function(fixer) {
                    // Add standalone: false to the component decorator
                    var lastProp = decoratorArgument.properties[decoratorArgument.properties.length - 1];
                    var insertionPoint = lastProp ? lastProp.range[1] : decoratorArgument.range[0] + 1;
                    return fixer.insertTextAfterRange(
                      [insertionPoint, insertionPoint],
                      decoratorArgument.properties.length > 0 
                        ? ",\n  standalone: false" 
                        : "standalone: false"
                    );
                  }
                });
              } 
              // If standalone property exists but is not explicitly false
              else if (
                standaloneProperty.value && 
                (standaloneProperty.value.type !== "Literal" ||
                 standaloneProperty.value.value !== false)
              ) {
                context.report({
                  node: standaloneProperty,
                  message: "Component must have standalone: false explicitly set",
                  fix: function(fixer) {
                    return fixer.replaceText(standaloneProperty.value, "false");
                  }
                });
              }
            }
          }
        };
      }
    }
  }
};
