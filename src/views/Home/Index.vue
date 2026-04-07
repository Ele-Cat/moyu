<template>
  <div class="home">
    <draggable
      v-model="homeStore.modules"
      class="modules"
      item-key="id"
      :animation="100"
      ghost-class="ghost"
      :forceFallback="true"
      :fallback-tolerance="8"
      :delay="10"
      handle=".module-card"
      @end="onDragEnd"
    >
      <template #item="{ element: module }">
        <div
          class="module-card"
          :class="{ 'is-folder': module.isFolder }"
          @click="handleClick(module)"
          @contextmenu.prevent="handleContextMenu($event, module)"
        >
          <div class="module-content">
            <div class="module-icon">{{ module.icon }}</div>
            <div class="module-name">{{ module.name }}</div>
            <div class="module-desc" v-if="!module.isFolder">{{ module.desc }}</div>
          </div>
        </div>
      </template>
    </draggable>

    <el-dialog v-model="showAddDialog" title="添加模块" width="400px">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="formData.isFolder">
            <el-radio :value="false">应用</el-radio>
            <el-radio :value="true">文件夹</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="formData.icon" placeholder="请输入图标emoji" />
        </el-form-item>
        <el-form-item label="描述" v-if="!formData.isFolder">
          <el-input v-model="formData.desc" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="路径" v-if="!formData.isFolder">
          <el-input v-model="formData.path" placeholder="请输入路径，如 /novel" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddModule">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEditDialog" title="编辑模块" width="400px">
      <el-form :model="editingModule" label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="editingModule.isFolder" disabled>
            <el-radio :value="false">应用</el-radio>
            <el-radio :value="true">文件夹</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="editingModule.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="editingModule.icon" placeholder="请输入图标emoji" />
        </el-form-item>
        <el-form-item label="描述" v-if="!editingModule.isFolder">
          <el-input v-model="editingModule.desc" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="路径" v-if="!editingModule.isFolder">
          <el-input v-model="editingModule.path" placeholder="请输入路径" />
        </el-form-item>
        <el-form-item label="宽度" v-if="!editingModule.isFolder">
          <el-input-number v-model="editingModule.width" :min="1" :max="3" />
        </el-form-item>
        <el-form-item label="高度" v-if="!editingModule.isFolder">
          <el-input-number v-model="editingModule.height" :min="1" :max="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleEditModule">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Rank } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { useHomeStore } from '@/stores/modules/home'

defineOptions({ name: 'Home' })

const router = useRouter()
const homeStore = useHomeStore()

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingModule = ref(null)

const formData = reactive({
  name: '',
  icon: '',
  desc: '',
  path: '',
  isFolder: false
})

function handleClick(module) {
  if (module.isFolder) {
    ElMessage.info('文件夹功能开发中')
  } else {
    router.push(module.path)
  }
}

function handleContextMenu(event, module) {
  editingModule.value = { ...module }
  
  ElMessageBox.confirm('', '', {
    confirmButtonText: '编辑',
    cancelButtonText: '删除',
    distinguishCancelAndClose: true,
    callback: (action) => {
      if (action === 'confirm') {
        showEditDialog.value = true
      } else if (action === 'cancel') {
        handleDelete(module)
      }
    }
  })
}

async function handleDelete(module) {
  try {
    await ElMessageBox.confirm(`确定要删除「${module.name}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    homeStore.removeModule(module.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

function handleAddModule() {
  if (!formData.name || !formData.icon) {
    ElMessage.warning('请填写名称和图标')
    return
  }
  
  if (!formData.isFolder && !formData.path) {
    ElMessage.warning('请填写路径')
    return
  }
  
  homeStore.addModule({
    name: formData.name,
    icon: formData.icon,
    desc: formData.desc || '',
    path: formData.path || '',
    isFolder: formData.isFolder
  })
  
  ElMessage.success('添加成功')
  showAddDialog.value = false
  
  formData.name = ''
  formData.icon = ''
  formData.desc = ''
  formData.path = ''
  formData.isFolder = false
}

function handleEditModule() {
  if (!editingModule.value.name || !editingModule.value.icon) {
    ElMessage.warning('请填写名称和图标')
    return
  }
  
  homeStore.updateModule(editingModule.value.id, editingModule.value)
  ElMessage.success('更新成功')
  showEditDialog.value = false
}

function onDragEnd() {
  ElMessage.success('排序已更新')
}
</script>

<style lang="less" scoped>
.home {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 30px;
}

.modules {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  align-content: flex-start;
}

.module-card {
  position: relative;
  width: calc(33.333% - 14px);
  height: 120px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  }

  &.is-folder {
    background: linear-gradient(135deg, #fff7e6 0%, #fff0dc 100%);
  }

  &.ghost {
    opacity: 0.5;
    background: #f0f0f0;
  }
}

.module-content {
  .module-icon {
    font-size: 36px;
    margin-bottom: 8px;
  }

  .module-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }

  .module-desc {
    font-size: 12px;
    color: #888;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.footer {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  margin-top: 20px;
  font-size: 12px;
  color: #666;
}
</style>
