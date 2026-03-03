'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Save } from 'lucide-react';

interface CodeEditorProps {
  language?: string;
  defaultValue?: string;
  onChange?: (value: string | undefined) => void;
  onRun?: (code: string) => void;
  onSave?: (code: string) => void;
  height?: string;
  readOnly?: boolean;
}

const CODE_TEMPLATES: Record<string, string> = {
  javascript: `// Write your JavaScript code here
function solution() {
  // Your code
}

// Test your solution
console.log(solution());`,
  python: `# Write your Python code here
def solution():
    # Your code
    pass

# Test your solution
print(solution())`,
  typescript: `// Write your TypeScript code here
function solution(): any {
  // Your code
}

// Test your solution
console.log(solution());`,
  java: `// Write your Java code here
public class Solution {
    public static void main(String[] args) {
        // Your code
    }
}`,
  cpp: `// Write your C++ code here
#include <iostream>
using namespace std;

int main() {
    // Your code
    return 0;
}`,
};

export default function CodeEditor({
  language = 'javascript',
  defaultValue,
  onChange,
  onRun,
  onSave,
  height = '500px',
  readOnly = false,
}: CodeEditorProps) {
  const [code, setCode] = useState(defaultValue || CODE_TEMPLATES[language] || '');
  const [isExecuting, setIsExecuting] = useState(false);
  const editorRef = useRef<any>(null);

  // Emit initial value so parent knows the editor content on mount
  useEffect(() => {
    onChange?.(code);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset code when language changes (unless a defaultValue is provided)
  useEffect(() => {
    if (!defaultValue) {
      const newCode = CODE_TEMPLATES[language] || '';
      setCode(newCode);
      onChange?.(newCode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || '');
    onChange?.(value);
  };

  const handleRun = async () => {
    if (!code.trim() || !onRun) return;
    
    setIsExecuting(true);
    try {
      await onRun(code);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSave = () => {
    if (!code.trim() || !onSave) return;
    onSave(code);
  };

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {language.toUpperCase()}
          </Badge>
          <span className="text-xs text-slate-400">
            {readOnly ? 'Read Only' : 'Edit Mode'}
          </span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {onSave && (
              <Button
                onClick={handleSave}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
              >
                <Save size={14} className="mr-1" />
                Save
              </Button>
            )}
            {onRun && (
              <Button
                onClick={handleRun}
                size="sm"
                disabled={isExecuting}
                className="h-7 text-xs bg-green-600 hover:bg-green-700"
              >
                <Play size={14} className="mr-1" />
                {isExecuting ? 'Running...' : 'Run Code'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Monaco Editor */}
      <Editor
        height={height}
        language={language}
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          readOnly,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          wrappingIndent: 'indent',
          formatOnPaste: true,
          formatOnType: true,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          snippetSuggestions: 'inline',
        }}
      />
    </div>
  );
}
