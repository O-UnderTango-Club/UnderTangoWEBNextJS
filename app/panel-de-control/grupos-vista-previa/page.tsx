import { notFound } from 'next/navigation';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import GroupPreview from './preview';
export const dynamic='force-dynamic';
export default async function Page(){
  // Local-only: no production auth bypass or operational write path.
  if(process.env.NODE_ENV!=='development'||process.env.LOCAL_GROUP_PREVIEW!=='1') notFound();
  const data=JSON.parse(await readFile(path.join(process.cwd(),'../grouped-preview.json'),'utf8'));
  return <GroupPreview initial={data}/>;
}
