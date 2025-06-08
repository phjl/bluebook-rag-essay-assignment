'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown'

export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [loadingSummarize, setLoadingSummarize] = useState(false);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault()
    setLoadingAsk(true);
    setAnswer('');

    await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        stream: true,
        messages: [
            { role: 'user', content: question }
        ]
        })
    }).then(
      handleResponseStream
    ).catch(
      handleError
    ).finally(
      () => {
        setLoadingAsk(false);
        setQuestion('');    
      }
    )    
  }

  function handleError(error:Error){
      console.log(error)
  }
  
  async function handleResponseStream(response:Response) {
    if(!response.body){
      setAnswer("No response")
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let done = false
    let aiResponse = ''

    while (!done) {
        const { value, done: streamDone } = await reader.read()
        done = streamDone
        if(value){
            const chunk = decoder.decode(value)
            aiResponse += chunk
            setAnswer(aiResponse)
        }
    }
  }

  async function handleSummarize(){
    setLoadingSummarize(true);
    setAnswer('');

    await fetch('http://localhost:3000/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: question
        })
    }).then(
      async response => {
        const summary = await response.text()
        setAnswer(summary)
      }
    ).catch(
      handleError
    ).finally(
      () => {
        setLoadingSummarize(false);
        setQuestion('');    
      }
    )    
  }
  function isLoading(): boolean {
    return loadingAsk || loadingSummarize;
  }

  return (
    <form onSubmit={handleAsk}>
        <div className="max-w-3xl mx-auto mt-10 space-y-4 px-4">
            <Input
                placeholder="Ask a question about Paul Graham's essays or suggest an essay to summarize"
                value={question}
                disabled={isLoading()}
                onChange={e => setQuestion(e.target.value)}
            />
            <div className="space-x-4">
              <Button type="submit" disabled={isLoading() || question.length < 1}>
                  {loadingAsk ? 'Thinking...' : 'Ask'}
              </Button>
              <Button onClick={handleSummarize} disabled={isLoading() || question.length < 1}>
                  {loadingSummarize ? 'Thinking...' : 'Generate summary'}
              </Button>
            </div>
            <ReactMarkdown>
                {answer}
            </ReactMarkdown>
        </div>
    </form>
  );
  
}