<template>
  <div class="wallpaper-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="壁纸" name="static">
        <Static />
      </el-tab-pane>
      <el-tab-pane label="动态壁纸" name="dynamic">
        <Dynamic />
      </el-tab-pane>
      <el-tab-pane label="历史" name="history">
        <History />
      </el-tab-pane>
      <el-tab-pane label="收藏" name="favorite">
        <Favorite />
      </el-tab-pane>
    </el-tabs>
    <div class="">
      <el-button 
        type="danger" 
        size="small"
        @click="stopVideoWallpaper"
      >
        停止壁纸
      </el-button>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'Wallpaper' })
import { ref } from 'vue'
import { Select } from '@element-plus/icons-vue'
import Static from './Static.vue'
import Dynamic from './Dynamic.vue'
import History from './History.vue'
import Favorite from './Favorite.vue'

const activeTab = ref('static')
</script>

<style scoped>
.wallpaper-page {
  height: 100%;
  padding: 10px 20px;
}
</style>
