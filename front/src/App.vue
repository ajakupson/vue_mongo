<script setup lang="ts">
  import MenuComponent from './components/MenuComponent.vue';
</script>

<template>
<div class="container-fluid">
    <div class="row flex-nowrap">
        <MenuComponent/>
        <div class="col py-3">
            <router-view></router-view>
        </div>
    </div>
</div>
</template>
