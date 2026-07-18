<template>
  <div class="edit-profile-container">
    <van-nav-bar title="编辑资料" left-text="返回" @click-left="handleBack" />

    <div class="form-section">
      <div class="avatar-row">
        <span class="label">头像</span>
        <div class="avatar-wrapper" @click="handleAvatarClick">
          <van-image :src="form.avatar || defaultAvatar" round class="avatar" />
          <van-icon name="plus" class="avatar-plus" />
        </div>
      </div>

      <van-cell-group inset>
        <van-field
          v-model="form.name"
          label="昵称"
          placeholder="请输入昵称"
          :maxlength="20"
          :error-message="nameError"
          @change="validateName"
        >
          <template #button>
            <span class="char-count">{{ form.name.length }}/20</span>
          </template>
        </van-field>

        <van-cell
          title="性别"
          :value="genderText"
          is-link
          @click="showGenderPicker = true"
        />

        <van-cell
          title="生日"
          :value="form.birthday || '请选择生日'"
          is-link
          @click="showDatePicker = true"
        />

        <van-cell
          title="所在城市"
          :value="cityText"
          is-link
          @click="showCityPicker = true"
        />

        <van-field
          v-model="form.intro"
          label="个人简介"
          type="textarea"
          placeholder="请输入个人简介"
          :maxlength="200"
          rows="3"
        >
          <template #button>
            <span class="char-count">{{ form.intro.length }}/200</span>
          </template>
        </van-field>
      </van-cell-group>
    </div>

    <div class="button-section">
      <van-button type="primary" :disabled="!hasChanges" @click="handleSave"
        >保存</van-button
      >
    </div>

    <van-action-sheet
      v-model:show="showGenderPicker"
      title="选择性别"
      :actions="genderOptions"
      cancel-text="取消"
      @select="selectGender"
    />

    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-date-picker
        v-model="currentDate"
        type="date"
        :min-date="minDate"
        :max-date="maxDate"
        title="选择生日"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showCityPicker" position="bottom">
      <van-area
        :area-list="areaList"
        title="选择城市"
        :columns-num="3"
        @confirm="onCityConfirm"
        @cancel="showCityPicker = false"
      />
    </van-popup>

    <van-dialog
      v-model:show="showConfirmDialog"
      title="提示"
      message="修改尚未保存，确定要离开吗？"
      show-cancel-button
      @confirm="confirmLeave"
      @cancel="showConfirmDialog = false"
    />

    <van-loading v-if="uploading" class="loading-overlay" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import { useAuth } from "../composables/useAuth";
import guestAvatar from "../assets/wsdr.png";
import { areaList } from "@vant/area-data";

const router = useRouter();
const { user, updateUserProfile, uploadAvatar } = useAuth();

const defaultAvatar = guestAvatar;

const form = ref({
  avatar: "",
  name: "",
  gender: 0,
  birthday: "",
  city: "",
  intro: "",
});

const originalForm = ref({});

const showGenderPicker = ref(false);
const showDatePicker = ref(false);
const showCityPicker = ref(false);
const showConfirmDialog = ref(false);
const uploading = ref(false);
const nameError = ref("");

const currentDate = ref([
  new Date().getFullYear(),
  new Date().getMonth() + 1,
  new Date().getDate(),
]);

const genderOptions = [
  { value: 0, name: "保密" },
  { value: 1, name: "男" },
  { value: 2, name: "女" },
];

const minDate = new Date("1900-01-01");
const maxDate = new Date();

const genderText = ref("保密");

const updateGenderText = () => {
  const item = genderOptions.find((g) => g.value === form.value.gender);
  genderText.value = item ? item.name : "保密";
};

const cityText = computed(() => {
  return form.value.city || "请选择城市";
});

const onCityConfirm = (values) => {
  let cityNames = [];
  if (values && typeof values === "object") {
    if (values.selectedOptions && Array.isArray(values.selectedOptions)) {
      cityNames = values.selectedOptions
        .map((v) => v.text || v.name || v)
        .filter(Boolean);
    } else if (values.province) {
      if (values.province.text) cityNames.push(values.province.text);
      else if (values.province.name) cityNames.push(values.province.name);
      if (values.city && (values.city.text || values.city.name)) {
        cityNames.push(values.city.text || values.city.name);
      }
      if (values.area && (values.area.text || values.area.name)) {
        cityNames.push(values.area.text || values.area.name);
      }
    }
  }
  form.value.city = cityNames.join(" ");
  showCityPicker.value = false;
};

const hasChanges = computed(() => {
  return (
    form.value.avatar !== originalForm.value.avatar ||
    form.value.name !== originalForm.value.name ||
    form.value.gender !== originalForm.value.gender ||
    form.value.birthday !== originalForm.value.birthday ||
    form.value.city !== originalForm.value.city ||
    form.value.intro !== originalForm.value.intro
  );
});

const validateName = () => {
  const name = form.value.name.trim();
  if (!name) {
    nameError.value = "昵称不能为空";
    return false;
  }
  if (name.length < 2) {
    nameError.value = "昵称至少2个字符";
    return false;
  }
  if (name.length > 20) {
    nameError.value = "昵称最多20个字符";
    return false;
  }
  if (/[<>&'"\\]/.test(name)) {
    nameError.value = "昵称不能包含特殊字符";
    return false;
  }
  nameError.value = "";
  return true;
};

const isSaving = ref(false);

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initForm = () => {
  if (isSaving.value) return;
  const u = user.value || {};
  const birthday = formatDate(u.birthday);
  form.value = {
    avatar: u.avatar || "",
    name: u.nickname || u.name || "",
    gender: u.gender !== undefined ? u.gender : 0,
    birthday,
    city: u.city || "",
    intro: u.intro || u.bio || "",
  };
  originalForm.value = { ...form.value };
  if (birthday) {
    const date = new Date(birthday);
    currentDate.value = [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
    ];
  }
  updateGenderText();
};

const handleAvatarClick = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg,image/png,image/webp";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("图片大小不能超过5MB");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("仅支持JPG、PNG、WEBP格式");
      return;
    }

    uploading.value = true;
    try {
      const result = await uploadAvatar(file);
      if (result.success && result.data) {
        form.value.avatar = result.data.url || result.data;
        showToast("头像上传成功");
      } else {
        showToast(result.message || "上传失败");
      }
    } catch (error) {
      showToast("上传异常，请重试");
    } finally {
      uploading.value = false;
    }
  };
  input.click();
};

const selectGender = (item) => {
  form.value.gender = item.value;
  updateGenderText();
  showGenderPicker.value = false;
};

const onDateConfirm = (date) => {
  let year, month, day;
  if (Array.isArray(date)) {
    [year, month, day] = date;
  } else if (date instanceof Date) {
    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
  } else {
    year = date.getFullYear ? date.getFullYear() : currentDate.value[0];
    month = date.getMonth ? date.getMonth() + 1 : currentDate.value[1];
    day = date.getDate ? date.getDate() : currentDate.value[2];
  }
  form.value.birthday = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  showDatePicker.value = false;
};

const handleSave = async () => {
  if (!validateName()) return;
  if (isSaving.value) return;

  isSaving.value = true;

  try {
    const data = {};
    if (form.value.name !== originalForm.value.name)
      data.nickname = form.value.name;
    if (form.value.gender !== originalForm.value.gender)
      data.gender = form.value.gender;
    if (form.value.birthday !== originalForm.value.birthday)
      data.birthday = form.value.birthday;
    if (form.value.city !== originalForm.value.city)
      data.city = form.value.city;
    if (form.value.intro !== originalForm.value.intro)
      data.intro = form.value.intro;
    if (form.value.avatar !== originalForm.value.avatar)
      data.avatar = form.value.avatar;

    const result = await updateUserProfile(data);
    if (result.success) {
      showToast("保存成功");
      originalForm.value = { ...form.value };
      setTimeout(() => {
        router.back();
      }, 1000);
    } else {
      showToast(result.message || "保存失败");
    }
  } finally {
    isSaving.value = false;
  }
};

const handleBack = () => {
  if (hasChanges.value) {
    showConfirmDialog.value = true;
  } else {
    router.back();
  }
};

const confirmLeave = () => {
  showConfirmDialog.value = false;
  router.back();
};

onMounted(() => {
  initForm();
});

watch(user, () => {
  if (!isSaving.value) {
    initForm();
  }
});
</script>

<style scoped>
.edit-profile-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.form-section {
  padding: 15px 0;
}

.avatar-row {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: white;
  margin-bottom: 15px;
}

.label {
  margin-left: 16px;
  width: 60px;
  font-size: 14px;
  color: #323233;
}

.avatar-wrapper {
  position: relative;
  margin-left: auto;
}

.avatar {
  width: 64px;
  height: 64px;
}

.avatar-plus {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background-color: #1989fa;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.char-count {
  font-size: 12px;
  color: #969799;
}

.button-section {
  padding: 20px 15px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
</style>
