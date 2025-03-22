# ymccb

Yonsei Mirae Campus City Bus

## Getting Started

### Prerequisites

- 공공데이터 API 키
- AWS API Gateway

### Installation

1. API Gateway 생성
2. [apigw](./apigw.json) 파일을 환경에 맞게 수정
3. API Gateway에 apigw.json 파일을 import

⚠️ 아래부터는 미구현 사항입니다.  
4. .env 파일 생성  
5. .env 파일에 API Gateway URL 추가  
6. Next.js 환경 변수 설정  

```bash
cp .env.example .env.local
```

7. Next.js 실행 (개발 모드)

```bash
npm run dev
```

8. Deploy

```bash
vercel deploy
```

## Built With

- [Vercel](https://vercel.com/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [AWS API Gateway](https://aws.amazon.com/ko/api-gateway/)
- [Leaflet](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [공공데이터포털](https://www.data.go.kr/)
- [Typescript](https://www.typescriptlang.org/)
- [React](https://reactjs.org/)
- [PapaParse](https://www.papaparse.com/)

## License

ymccb is open-sourced under the **AGPL-3.0 License**.

Copyright (c) 2025 F8DC102.
See [LICENSE](./LICENSE) for more details.

> 이 프로젝트는 연세대학교 미래캠퍼스 커뮤니티를 위해 만들어졌으며,  
> 누구나 자유롭게 사용할 수 있지만, 소스코드 공개와 원저작자 표시를 반드시 지켜주세요.
