import { NextRequest, NextResponse } from 'next/server';
import { ApiSpec, ArtifactSet } from '@/lib/types';
import { generateReadme } from '@/lib/generators/readme-generator';
import { generateCurlExamples } from '@/lib/generators/curl-generator';
import { generatePythonClient } from '@/lib/generators/python-generator';
import { generateTypeScriptClient } from '@/lib/generators/typescript-generator';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { spec } = body as { spec: ApiSpec };

        if (!spec || !spec.endpoints) {
            return NextResponse.json({ error: 'No valid API spec provided' }, { status: 400 });
        }

        const artifacts: ArtifactSet = {
            readme: generateReadme(spec),
            curlExamples: generateCurlExamples(spec),
            pythonClient: generatePythonClient(spec),
            typescriptClient: generateTypeScriptClient(spec),
        };

        return NextResponse.json({ artifacts });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown generation error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
