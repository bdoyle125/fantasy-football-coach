import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '',
            name: 'Home',
            component: () => import('../pages/TeamList.vue'),
        },
        {
            path: '/player/:playerId',
            name: 'PlayerCard',
            component: () => import('../pages/PlayerCard.vue'),
        },
        {
            path: '/matchup',
            name: 'MatchupPreview',
            component: () => import('../pages/MatchupPreview.vue'),
        }
    ],
})

export default router