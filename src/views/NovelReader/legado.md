### 整体架构说明
实现书源解析+阅读功能，核心分为**Rust后端**（负责书源规则解析、网络请求、文本处理）和**Vue3前端**（负责阅读界面、交互、数据展示），两者通过HTTP接口通信。

### 一、Rust后端关键代码（基于Axum + reqwest + 解析库）
#### 1. 依赖配置（Cargo.toml）
```toml
[package]
name = "book_reader_backend"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
tokio = { version = "1.0", features = ["full"] }
reqwest = { version = "0.11", features = ["json", "rustls-tls"] }
scraper = "0.18"  # HTML解析
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
url = "2.5"
regex = "1.10"    # 正则解析书源规则
```

#### 2. 核心代码（src/main.rs）
```rust
use axum::{
    extract::Json,
    http::StatusCode,
    routing::{get, post},
    Router,
};
use regex::Regex;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// 书源解析请求参数
#[derive(Debug, Deserialize)]
struct BookSourceRequest {
    source_url: String,       // 书籍详情页URL
    source_rules: HashMap<String, String>, // 书源规则（如标题、内容、章节列表的选择器/正则）
}

// 章节信息
#[derive(Debug, Serialize)]
struct Chapter {
    title: String,
    url: String,
}

// 书籍详情
#[derive(Debug, Serialize)]
struct BookDetail {
    title: String,
    author: String,
    chapters: Vec<Chapter>,
}

// 章节内容响应
#[derive(Debug, Serialize)]
struct ChapterContentResponse {
    content: Vec<String>,
    next_chapter_url: Option<String>,
}

// 通用响应结构体
#[derive(Debug, Serialize)]
struct ApiResponse<T> {
    code: u16,
    msg: String,
    data: Option<T>,
}

// 解析书籍详情
async fn parse_book_detail(req: Json<BookSourceRequest>) -> Result<Json<ApiResponse<BookDetail>>, StatusCode> {
    // 1. 请求书籍详情页
    let resp = reqwest::get(&req.source_url)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let html = resp.text().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let document = Html::parse_document(&html);

    // 2. 解析标题（从书源规则取选择器/正则）
    let title_selector = Selector::parse(req.source_rules.get("title").unwrap())
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    let title = document.select(&title_selector).next().unwrap().text().collect::<String>();

    // 3. 解析章节列表
    let chapter_selector = Selector::parse(req.source_rules.get("chapter_list").unwrap())
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    let base_url = url::Url::parse(&req.source_url).unwrap();
    let mut chapters = Vec::new();
    for chapter in document.select(&chapter_selector) {
        let chapter_title = chapter.text().collect::<String>();
        let chapter_href = chapter.value().attr("href").unwrap();
        // 拼接绝对URL
        let chapter_url = base_url.join(chapter_href).unwrap().to_string();
        chapters.push(Chapter {
            title: chapter_title,
            url: chapter_url,
        });
    }

    // 4. 解析作者（示例）
    let author_selector = Selector::parse(req.source_rules.get("author").unwrap())
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    let author = document.select(&author_selector).next().unwrap().text().collect::<String>();

    Ok(Json(ApiResponse {
        code: 200,
        msg: "success".to_string(),
        data: Some(BookDetail { title, author, chapters }),
    }))
}

// 解析章节内容
async fn parse_chapter_content(
    Json(req): Json<HashMap<String, String>>,
) -> Result<Json<ApiResponse<ChapterContentResponse>>, StatusCode> {
    let chapter_url = req.get("chapter_url").unwrap();
    let content_rule = req.get("content_rule").unwrap();

    // 1. 请求章节内容页
    let resp = reqwest::get(chapter_url)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let html = resp.text().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let document = Html::parse_document(&html);

    // 2. 解析章节内容（按规则提取，去除广告等无关内容）
    let content_selector = Selector::parse(content_rule).map_err(|_| StatusCode::BAD_REQUEST)?;
    let mut content = Vec::new();
    for node in document.select(&content_selector) {
        let text = node.text().collect::<String>().trim().to_string();
        if !text.is_empty() {
            content.push(text);
        }
    }

    // 3. 解析下一章URL（示例）
    let next_selector = Selector::parse(req.get("next_chapter_rule").unwrap())
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    let next_chapter_url = document
        .select(&next_selector)
        .next()
        .map(|n| {
            let base_url = url::Url::parse(chapter_url).unwrap();
            base_url.join(n.value().attr("href").unwrap()).unwrap().to_string()
        });

    Ok(Json(ApiResponse {
        code: 200,
        msg: "success".to_string(),
        data: Some(ChapterContentResponse { content, next_chapter_url }),
    }))
}

#[tokio::main]
async fn main() {
    // 构建路由
    let app = Router::new()
        .route("/api/parse-book", post(parse_book_detail))
        .route("/api/parse-chapter", post(parse_chapter_content));

    // 启动服务
    let addr = ([127, 0, 0, 1], 3000).into();
    println!("Server running on http://{}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_svc())
        .await
        .unwrap();
}
```

### 二、Vue3前端关键代码（基于Vite + Axios + 阅读组件）
#### 1. 依赖安装
```bash
npm install axios vue-router pinia
```

#### 2. 接口请求封装（src/api/book.js）
```javascript
import axios from 'axios';

const request = axios.create({
  baseURL: 'http://127.0.0.1:3000/api',
  timeout: 10000,
});

// 解析书籍详情
export const parseBookDetail = (data) => {
  return request.post('/parse-book', data);
};

// 解析章节内容
export const parseChapterContent = (data) => {
  return request.post('/parse-chapter', data);
};
```

#### 3. 阅读页面组件（src/views/Reader.vue）
```vue
<template>
  <div class="reader-container">
    <!-- 书籍信息头部 -->
    <div class="book-header" v-if="bookDetail">
      <h1>{{ bookDetail.title }}</h1>
      <p>作者：{{ bookDetail.author }}</p>
    </div>

    <!-- 章节列表侧边栏 -->
    <div class="chapter-list" v-if="bookDetail">
      <h3>章节列表</h3>
      <ul>
        <li 
          v-for="(chapter, index) in bookDetail.chapters" 
          :key="index"
          @click="switchChapter(chapter.url)"
          :class="{ active: currentChapterUrl === chapter.url }"
        >
          {{ chapter.title }}
        </li>
      </ul>
    </div>

    <!-- 阅读区域 -->
    <div class="reading-area" v-if="chapterContent.length">
      <div class="content-item" v-for="(para, index) in chapterContent" :key="index">
        {{ para }}
      </div>
      <button @click="nextChapter" v-if="nextChapterUrl">下一章</button>
    </div>

    <!-- 加载中 -->
    <div class="loading" v-if="loading">加载中...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { parseBookDetail, parseChapterContent } from '@/api/book';

// 响应式数据
const bookDetail = ref(null);
const chapterContent = ref([]);
const currentChapterUrl = ref('');
const nextChapterUrl = ref('');
const loading = ref(false);

// 书源规则（可从配置/数据库读取，此处示例固定）
const sourceRules = ref({
  title: 'h1.book-title',
  author: 'span.author',
  chapter_list: 'ul.chapter-list li a',
  content_rule: 'div.chapter-content p',
  next_chapter_rule: 'a.next-chapter',
});

// 初始化：解析书籍详情
const initBook = async () => {
  loading.value = true;
  try {
    // 示例书籍URL（需替换为实际书源URL）
    const res = await parseBookDetail({
      source_url: 'https://example.com/book/123',
      source_rules: sourceRules.value,
    });
    if (res.data.code === 200) {
      bookDetail.value = res.data.data;
      // 默认加载第一章
      if (bookDetail.value.chapters.length) {
        switchChapter(bookDetail.value.chapters[0].url);
      }
    }
  } catch (err) {
    console.error('解析书籍失败：', err);
  } finally {
    loading.value = false;
  }
};

// 切换章节
const switchChapter = async (url) => {
  loading.value = true;
  currentChapterUrl.value = url;
  try {
    const res = await parseChapterContent({
      chapter_url: url,
      content_rule: sourceRules.value.content_rule,
      next_chapter_rule: sourceRules.value.next_chapter_rule,
    });
    if (res.data.code === 200) {
      chapterContent.value = res.data.data.content;
      nextChapterUrl.value = res.data.data.next_chapter_url;
    }
  } catch (err) {
    console.error('解析章节失败：', err);
  } finally {
    loading.value = false;
  }
};

// 下一章
const nextChapter = () => {
  if (nextChapterUrl.value) {
    switchChapter(nextChapterUrl.value);
  }
};

onMounted(() => {
  initBook();
});
</script>

<style scoped>
.reader-container {
  display: flex;
  height: 100vh;
}

.book-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: #fff;
  border-bottom: 1px solid #eee;
  z-index: 10;
}

.chapter-list {
  width: 300px;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid #eee;
  padding-top: 80px;
}

.chapter-list li {
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.chapter-list li.active {
  background: #f5f5f5;
  color: #409eff;
}

.reading-area {
  flex: 1;
  padding: 100px 2rem 2rem;
  overflow-y: auto;
  line-height: 1.8;
  font-size: 16px;
}

.content-item {
  margin-bottom: 1rem;
}

.loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
}
</style>
```

### 三、关键说明
1. **书源规则适配**：
   - Rust端的`scraper`库用于CSS选择器解析，`regex`用于正则解析（应对不同书源规则）；
   - 实际场景中，书源规则需支持配置化（如JSON/数据库存储），而非硬编码。

2. **网络请求处理**：
   - Rust端需处理反爬（如User-Agent、Cookie、代理）、编码转换（GBK/UTF-8）；
   - 可添加缓存层（如Redis）减少重复请求。

3. **前端阅读体验**：
   - 可扩展功能：字体大小/背景色调整、进度记忆、目录折叠、翻页动画；
   - 章节内容需做清洗（去除广告、无关标签）。

4. **跨域处理**：
   - Rust后端需添加CORS中间件（如`axum-cors`），允许前端域名访问：
     ```rust
     use axum_cors::CorsLayer;
     let app = Router::new()
         .layer(CorsLayer::permissive()) // 开发环境，生产需限制域名
         .route("/api/parse-book", post(parse_book_detail));
     ```

5. **扩展性**：
   - Rust端可封装书源解析逻辑为独立库，支持多规则引擎；
   - 前端可使用`vueuse`实现阅读进度、夜间模式等功能。

### 四、运行步骤
1. 启动Rust后端：`cargo run`；
2. 启动Vue前端：`npm run dev`；
3. 替换示例中的`source_url`和`source_rules`为实际书源地址和解析规则。