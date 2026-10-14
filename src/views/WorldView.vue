<script setup>
import { profile } from "../data/profile";
import { site } from "../data/site";
import { projects } from "../data/projects";
import { experience } from "../data/experience";
import ProjectEntry from "../components/content/ProjectEntry.vue";
import SectionNavigation from "../components/ui/SectionNavigation.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
useScrollReveal();
const sections = [
  { label: "About", hash: "#about" },
  { label: "Projects", hash: "#projects" },
  { label: "Experience", hash: "#experience" },
];
</script>
<template>
  <div class="shell world-view">
    <header class="page-heading">
      <p class="eyebrow">01 / 我的个人世界</p>
      <h1 class="display" tabindex="-1">My World</h1>
      <SectionNavigation :items="sections" />
    </header>
    <section
      id="about"
      class="content-section about-section"
      tabindex="-1"
      data-reveal
    >
      <div class="section-side">
        <span class="eyebrow">ABOUT ME</span>
        <h2 class="display">{{ site.nickname }}</h2>
        <span v-if="profile.isPlaceholder" class="draft-label"
          >个人内容待补充</span
        >
      </div>
      <div class="about-copy">
        <p class="about-introduction">{{ profile.introduction }}</p>
        <div class="about-details">
          <div>
            <h3 class="eyebrow">兴趣 / INTERESTS</h3>
            <p>
              {{
                profile.interests.length
                  ? profile.interests.join("、")
                  : "待补充"
              }}
            </p>
          </div>
          <div>
            <h3 class="eyebrow">正在学习 / LEARNING</h3>
            <p>
              {{
                profile.learning.length ? profile.learning.join("、") : "待补充"
              }}
            </p>
          </div>
        </div>
        <p v-if="profile.direction" class="body-copy">
          {{ profile.direction }}
        </p>
        <div class="entry-links">
          <template v-for="link in site.socials" :key="link.label"
            ><a
              v-if="link.url"
              :href="link.url"
              class="text-link"
              target="_blank"
              rel="noopener noreferrer"
              >{{ link.label }} ↗</a
            ><span v-else class="muted small"
              >{{ link.label }} 链接待添加</span
            ></template
          >
        </div>
      </div>
    </section>
    <section id="projects" class="content-section" tabindex="-1">
      <div class="section-heading">
        <h2 class="display">Projects</h2>
        <span class="muted small">项目与作品</span>
      </div>
      <ProjectEntry
        v-for="(project, index) in projects"
        :key="project.id"
        :project="project"
        :index="index"
      />
      <p v-if="!projects.length" class="empty-note">项目正在整理。</p>
    </section>
    <section id="experience" class="content-section" tabindex="-1">
      <div class="section-heading">
        <h2 class="display">Experience</h2>
        <span class="muted small">学习与经历</span>
      </div>
      <ol v-if="experience.length" class="experience-list">
        <li v-for="item in experience" :key="item.id" data-reveal>
          <span class="eyebrow">{{ item.date }}</span>
          <div>
            <h3>{{ item.title }}</h3>
            <p class="body-copy">{{ item.description }}</p>
          </div>
        </li>
      </ol>
      <div v-else class="empty-note" data-reveal>
        <span class="eyebrow">TO BE CONTINUED</span>
        <p>学习、竞赛与开发经历，等待正式内容补充。</p>
      </div>
    </section>
    <nav class="next-chapter" aria-label="继续浏览">
      <span class="eyebrow">NEXT / 音乐与回忆</span
      ><RouterLink to="/music" class="display"
        >Music & Memories <span aria-hidden="true">↗</span></RouterLink
      >
    </nav>
  </div>
</template>
