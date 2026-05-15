import { AnalysisResult, ScoringWeights, JdAnalysis } from "../types";

async function getFileText(file: File): Promise<string> {
  console.log(`[FileText] Processing: ${file.name}, MIME: ${file.type}`);
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/extract-text', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Text extraction failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.text) {
      throw new Error(`Empty text returned for ${file.name}`);
    }

    return data.text;
  } catch (error) {
    console.error(`[FileText] Error extracting ${file.name}:`, error);
    throw new Error(`Failed to read file ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function aiFetch(endpoint: string, body: unknown): Promise<Response> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${response.statusText}`);
  }
  return response;
}

export async function parseJdFile(file: File): Promise<string> {
  return await getFileText(file);
}

export async function analyzeJd(jdText: string, language: 'en' | 'zh' = 'en'): Promise<JdAnalysis> {
  const response = await aiFetch('/api/ai/analyze-jd', { jdText, language });
  return response.json();
}

export async function analyzeResume(
  jdText: string,
  file: File,
  weights: ScoringWeights,
  language: 'en' | 'zh' = 'en'
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('jdText', jdText);
  formData.append('weights', JSON.stringify(weights));
  formData.append('language', language);

  const response = await fetch('/api/ai/analyze-resume', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Analysis failed: ${response.statusText}`);
  }

  const analysis = await response.json();
  return {
    ...analysis,
    file_name: file.name,
    // file_data is provided by the server (already encoded from req.file.buffer)
  };
}

export async function analyzeText(prompt: string): Promise<string> {
  const response = await aiFetch('/api/ai/generate', { prompt, expectJson: false });
  const data = await response.json();
  return data.text;
}

export async function evaluateCandidateByText(jd: string, candidateJson: string): Promise<string> {
  const prompt = `
    You are the ST AI Recruiting Assistant.
    Analyze the following candidate data against the provided Job Description.
    Answer the user's question with deep insights, specific evidence from the resume, and ST-specific recruitment context.

    [JD]:
    ${jd}

    [Candidate Data]:
    ${candidateJson}

    Keep your response professional, helpful, and concise (max 300 words).
  `;
  return analyzeText(prompt);
}

export async function compareCandidates(
  jd: string,
  candidates: { name: string; scores: Record<string, number>; highlights: string[]; gaps: string[] }[],
  language: 'en' | 'zh' = 'en'
): Promise<string> {
  const isZh = language === 'zh';
  const prompt = isZh
    ? `你是资深HR。对比以下候选人并给出分析。

JD 要求:
${jd}

候选人对比:
${candidates.map((c, i) => `
${i + 1}. ${c.name}
  分数: ${Object.entries(c.scores).map(([k, v]) => `${k}:${v}`).join(', ')}
  亮点: ${c.highlights.join('; ')}
  不足: ${c.gaps.join('; ')}
`).join('\n')}

请用中文给出简要对比分析（3-4句），包括各自的优势劣势和最终推荐。`
    : `You are a senior HR expert. Compare these candidates and provide analysis.

Job Requirements:
${jd}

Candidate Comparison:
${candidates.map((c, i) => `
${i + 1}. ${c.name}
  Scores: ${Object.entries(c.scores).map(([k, v]) => `${k}:${v}`).join(', ')}
  Highlights: ${c.highlights.join('; ')}
  Gaps: ${c.gaps.join('; ')}
`).join('\n')}

Give a brief 3-4 sentence comparative analysis: strengths, weaknesses, and final recommendation.`;

  return analyzeText(prompt);
}
