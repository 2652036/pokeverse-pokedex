# 🌌 PokéVerse - Binance Style Pokédex

**PokéVerse(포켓버스)**는 모던하고 시각적으로 뛰어난 바이낸스(Binance) 금융 거래소 스타일의 웹 기반 포켓몬 도감입니다. 
Pure HTML, CSS, JavaScript로 개발되었으며, 실시간으로 한국어와 영어 인터페이스를 토글할 수 있는 다국어 기능을 지원합니다.

👉 **라이브 데모 사이트**: [https://2652036.github.io/pokeverse-pokedex/](https://2652036.github.io/pokeverse-pokedex/)  
*(아래의 **[GitHub Pages 활성화 방법]**을 따라 설정하시면 위 주소로 웹 사이트가 즉시 호스팅됩니다!)*

---

## 💎 주요 기능 (Key Features)

### 1. 바이낸스 거래소 스타일 테마 (Binance Design System)
* **컬러 블록 레이아웃**: 글래스모피즘 대신 바이낸스 특유의 짙은 차콜 `#0B0E11` 캔버스와 플랫 카드 블록 `#1E2329`, 정밀한 1px 헤어라인 테두리 `#2B3139`를 채택했습니다.
* **타이포그래피**: 텍스트 가독성을 위해 **Inter** 폰트를 적용하고, 포켓몬 ID, 키, 몸무게 및 수치 데이터에는 금융 지표 가독성을 지닌 **IBM Plex Sans** 폰트를 혼용하였습니다.
* **트레이딩 그린/레드 능력치**: 포켓몬의 개별 능력치(Base Stats) 강도에 따라 거래소 등락 지표처럼 **트레이딩 그린(Up)**, **시그니처 옐로우(Neutral)**, **트레이딩 레드(Down)** 색상이 게이지 바에 동적으로 매핑됩니다.

### 2. 한국어 / 영어 실시간 다국어 지원 (Dynamic Translation)
* 네비게이션 바의 **`KO | EN` 토글 버튼** 클릭 한 번으로 웹사이트 전체가 실시간 번역됩니다.
* 검색 필드 플레이스홀더, 필터링 옵션뿐 아니라 포켓몬의 **이름, 속성 타입(예: 풀/독 ➔ Grass/Poison), 세대 정보, 진화 방법 조건(예: Lv. ➔ 레벨), 도감 상세 설명글**까지 완벽하게 로컬라이징됩니다.

### 3. 고성능 아키텍처 & 부드러운 UX
* **데이터 사전 컴파일**: 1025마리의 모든 포켓몬 메타데이터를 하나의 JSON 파일로 컴파일하여, 첫 화면 로딩과 검색/필터 작동 시 API 딜레이가 전혀 없는 즉각적인 반응 속도를 제공합니다.
* **무한 스크롤 (Infinite Scroll)**: 스크롤 감지를 통해 24마리씩 카드를 순차적으로 로드하여 대량의 데이터에서도 브라우저 버벅임이 없습니다.
* **상세 정보 모달 & 캐싱**: 카드 클릭 시 공식 3D 아트워크, 실제 인게임 울음소리 재생(Cry Audio Pulse 이펙트), 진화 트리가 렌더링되며, 한 번 로드된 정보는 메모리에 캐싱되어 재오픈 시 0초 만에 로드됩니다.
* **진화 트리 내비게이션**: 진화 과정에 있는 포켓몬 카드를 클릭하면 모달을 닫지 않고 해당 포켓몬의 도감 정보로 즉시 이동합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

* **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript
* **API Integration**: [PokeAPI](https://pokeapi.co/)
* **Icon Library**: Phosphor Icons (CDN)
* **Fonts**: Google Fonts (Inter, IBM Plex Sans)
* **Dev Utility**: Node.js & http-server

---

## 💻 실행 방법 (How to Run)

### 로컬 환경에서 실행하기
프로젝트 폴더 내에서 다음 명령어를 입력하여 로컬 개발 서버를 실행할 수 있습니다.
```bash
# 의존성 설치 없이 즉시 실행
npm run dev
```
실행 후 브라우저에서 **[http://localhost:8000](http://localhost:8000)**으로 접속합니다.

---

## 🌐 깃허브에서 바로 열기 (GitHub Pages 설정 방법)

이 프로젝트를 깃허브 주소를 통해 인터넷에 호스팅하여 바로 접속할 수 있게 설정하는 방법입니다:

1. 생성하신 깃허브 프로젝트 저장소([https://github.com/2652036/pokeverse-pokedex](https://github.com/2652036/pokeverse-pokedex))로 이동합니다.
2. 상단 탭 메뉴 중 ⚙️ **Settings** (설정)를 클릭합니다.
3. 왼쪽 사이드바 메뉴에서 **Code and automation** 카테고리 내의 📄 **Pages**를 클릭합니다.
4. **Build and deployment** 섹션의 **Source** 항목이 **Deploy from a branch**로 되어 있는지 확인합니다.
5. 바로 아래 **Branch** 설정에서 `None`으로 되어 있는 드롭다운을 클릭하여 **`main`** 브랜치로 변경하고, 우측 폴더 경로를 `/ (root)`로 둔 상태에서 **[Save]** (저장) 버튼을 클릭합니다.
6. 1~2분 정도 기다리신 후 새로고침하시면 페이지 상단에 **"Your site is live at..."** 문구와 함께 실시간 주소가 생성됩니다.
7. 이제 전 세계 어디서나 [https://2652036.github.io/pokeverse-pokedex/](https://2652036.github.io/pokeverse-pokedex/) 주소로 접속해 포켓몬 도감을 실행할 수 있습니다!
