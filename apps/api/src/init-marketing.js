import {readFileSync} from 'node:fs';
import {pool} from './db.js';
try {
  const sql=readFileSync(new URL('../sql/marketing.sql',import.meta.url),'utf8');
  await pool.query(sql);
  console.log('Tabela de contatos comerciais inicializada.');
} catch(e) {console.error('Erro ao inicializar marketing:',e);process.exitCode=1}
finally {await pool.end()}
