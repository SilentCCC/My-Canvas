# AI Canvas

&#x672C;&#x5730;&#x8FD0;&#x884C;&#x7684; AI &#x65E0;&#x9650;&#x753B;&#x5E03;&#x3002;&#x4F7F;&#x7528; React Flow &#x7BA1;&#x7406;&#x753B;&#x5E03;&#xFF0C;&#x901A;&#x8FC7;&#x672C;&#x5730; Node.js &#x4EE3;&#x7406;&#x8C03;&#x7528; OpenAI &#x517C;&#x5BB9;&#x56FE;&#x7247;&#x63A5;&#x53E3;&#x3002;

## &#x542F;&#x52A8;

1. &#x5B89;&#x88C5; Node.js 18 &#x6216;&#x66F4;&#x9AD8;&#x7248;&#x672C;&#x3002;
2. &#x53CC;&#x51FB;&#x6839;&#x76EE;&#x5F55;&#x4E2D;&#x7684; start.bat&#x3002;
3. &#x811A;&#x672C;&#x4F1A;&#x81EA;&#x52A8;&#x5B89;&#x88C5;&#x4F9D;&#x8D56;&#x3001;&#x6784;&#x5EFA;&#x7F51;&#x9875;&#x5E76;&#x6253;&#x5F00; http://localhost:3000&#x3002;

&#x624B;&#x52A8;&#x542F;&#x52A8;&#xFF1A; npm install -&gt; npm run build -&gt; npm run server

## &#x5DF2;&#x5B9E;&#x73B0;

- &#x65E0;&#x9650;&#x753B;&#x5E03;&#xFF1A;&#x5E73;&#x79FB;&#x3001;&#x7F29;&#x653E;&#x3001;&#x8282;&#x70B9;&#x62D6;&#x52A8;&#x3001;&#x5220;&#x9664;&#x548C;&#x8FDE;&#x7EBF;&#x3002;
- Prompt &#x8282;&#x70B9;&#xFF1A;&#x7F16;&#x8F91; Prompt&#xFF0C;&#x76F4;&#x63A5;&#x8BBE;&#x7F6E;&#x6A21;&#x578B;&#x3001;&#x5C3A;&#x5BF8;&#x548C;&#x8D28;&#x91CF;&#x3002;
- &#x56FE;&#x7247;&#x8282;&#x70B9;&#xFF1A;&#x81EA;&#x52A8;&#x653E;&#x5165;&#x753B;&#x5E03;&#x3001;&#x53EF;&#x62D6;&#x52A8;&#x3001;&#x7F29;&#x653E;&#x3001;&#x6253;&#x5F00;&#x548C;&#x4E0B;&#x8F7D;&#x3002;
- API &#x8BBE;&#x7F6E;&#xFF1A;&#x652F;&#x6301;&#x591A;&#x4E2A;&#x914D;&#x7F6E;&#x6863;&#x3001;&#x5207;&#x6362;&#x3001;&#x65B0;&#x5EFA;&#x3001;&#x5220;&#x9664;&#x3001;&#x8FDE;&#x63A5;&#x6D4B;&#x8BD5;&#x3001;JSON &#x5BFC;&#x5165;&#x5BFC;&#x51FA;&#x3002;
- &#x5386;&#x53F2;&#x8BB0;&#x5F55;&#xFF1A;&#x4FDD;&#x5B58;&#x6700;&#x8FD1; 50 &#x6B21;&#x751F;&#x6210;&#x7ED3;&#x679C;&#x3002;

## &#x914D;&#x7F6E;&#x5B89;&#x5168;

API Key &#x53EA;&#x4FDD;&#x5B58;&#x5728; server/config.json&#xFF0C;&#x6D4F;&#x89C8;&#x5668;&#x53EA;&#x4F1A;&#x6536;&#x5230; hasApiKey &#x72B6;&#x6001;&#x3002;&#x5BFC;&#x51FA;&#x914D;&#x7F6E;&#x65F6;&#x4F1A;&#x5305;&#x542B; API Key&#xFF0C;&#x8BF7;&#x4E0D;&#x8981;&#x5206;&#x4EAB;&#x5BFC;&#x51FA;&#x6587;&#x4EF6;&#x3002;

## &#x6269;&#x5C55;&#x4F4D;&#x7F6E;

&#x751F;&#x6210;&#x8BF7;&#x6C42;&#x7EDF;&#x4E00;&#x7ECF;&#x8FC7; /api/generate&#xFF0C;&#x540E;&#x7EED;&#x53EF;&#x5728; server/server.js &#x4E2D;&#x6269;&#x5C55; Flux&#x3001;Midjourney&#x3001;DALL-E&#x3001;&#x653E;&#x5927;&#x6A21;&#x578B;&#x548C; LoRA &#x9002;&#x914D;&#x5668;&#x3002;
