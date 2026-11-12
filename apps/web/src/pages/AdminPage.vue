<script setup lang="ts">
import { onMounted, reactive, ref, shallowRef } from "vue";
import { RouterLink, useRouter } from "vue-router";
import type { AdminLead, AdminModel, AdminSummary, AdminTrim, NewsArticle, Order, OrderStatus, Store } from "@wangshu/shared";
import { useAuthStore } from "../stores/auth";
import { api, errorMessage } from "../lib/api";
import { money } from "../lib/format";

const auth = useAuthStore();
const router = useRouter();
const tab = ref<"overview" | "orders" | "leads" | "models" | "stores" | "news">("overview");
const ready = ref(false);
const denied = ref(false);
const loading = ref(false);
const error = ref("");
const notice = ref("");
const summary = shallowRef<AdminSummary | null>(null);
const orders = shallowRef<Order[]>([]);
const leads = shallowRef<AdminLead[]>([]);
const adminModels = shallowRef<AdminModel[]>([]);
const adminStores = shallowRef<Store[]>([]);
const adminNews = shallowRef<NewsArticle[]>([]);
const newsForm = reactive({
  id: 0,
  title: "",
  tag: "产品",
  summary: "",
  body: "",
  status: "published",
  publishedAt: todayShanghai(),
});
const trimDrafts = ref<Record<number, string>>({});
const storeDrafts = ref<Record<number, { address: string; phone: string; hours: string }>>({});
const updating = ref("");

function todayShanghai(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
}

const statusLabels: Record<OrderStatus, string> = {
  pending_payment: "待支付",
  paid: "已支付",
  confirmed: "已确认",
  delivered: "已交付",
  cancelled: "已取消",
};

const tabs = [
  { id: "overview" as const, label: "概览" },
  { id: "orders" as const, label: "订单" },
  { id: "leads" as const, label: "试驾线索" },
  { id: "models" as const, label: "车型价格" },
  { id: "stores" as const, label: "门店" },
  { id: "news" as const, label: "新闻" },
];

async function loadAll(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const [nextSummary, nextOrders, nextLeads, nextModels, nextStores, nextNews] = await Promise.all([
      api.adminSummary(),
      api.adminOrders(),
      api.adminLeads(),
      api.adminModels(),
      api.adminStores(),
      api.adminNews(),
    ]);
    summary.value = nextSummary;
    orders.value = nextOrders;
    leads.value = nextLeads;
    adminModels.value = nextModels;
    adminStores.value = nextStores;
    adminNews.value = nextNews;
    trimDrafts.value = Object.fromEntries(
      nextModels.flatMap((model) => model.trims.map((trim) => [trim.id, String(trim.price / 1_000_000)])),
    );
    storeDrafts.value = Object.fromEntries(
      nextStores.map((store) => [store.id, { address: store.address, phone: store.phone, hours: store.hours }]),
    );
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
}

async function setStatus(order: Order, status: string): Promise<void> {
  updating.value = order.orderNo;
  notice.value = "";
  error.value = "";
  try {
    await api.updateAdminOrderStatus(order.orderNo, status);
    await loadAll();
    notice.value = `订单 ${order.orderNo} 已更新`;
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    updating.value = "";
  }
}

function resetNewsForm(): void {
  newsForm.id = 0;
  newsForm.title = "";
  newsForm.tag = "产品";
  newsForm.summary = "";
  newsForm.body = "";
  newsForm.status = "published";
  newsForm.publishedAt = todayShanghai();
}

function editNews(article: NewsArticle): void {
  newsForm.id = article.id;
  newsForm.title = article.title;
  newsForm.tag = article.tag;
  newsForm.summary = article.summary;
  newsForm.body = article.body;
  newsForm.status = article.status;
  newsForm.publishedAt = article.publishedAt;
}

async function saveNews(): Promise<void> {
  error.value = "";
  notice.value = "";
  try {
    if (newsForm.id > 0) {
      await api.updateAdminNews(newsForm.id, {
        title: newsForm.title,
        tag: newsForm.tag,
        summary: newsForm.summary,
        body: newsForm.body,
        status: newsForm.status,
        publishedAt: newsForm.publishedAt,
      });
      notice.value = "文章已更新";
    } else {
      await api.createAdminNews({
        title: newsForm.title,
        tag: newsForm.tag,
        summary: newsForm.summary,
        body: newsForm.body,
        status: newsForm.status,
        publishedAt: newsForm.publishedAt,
      });
      notice.value = "文章已创建";
    }
    resetNewsForm();
    await loadAll();
  } catch (err) {
    error.value = errorMessage(err);
  }
}

async function removeNews(article: NewsArticle): Promise<void> {
  if (!window.confirm("删除《" + article.title + "》？")) return;
  error.value = "";
  notice.value = "";
  try {
    await api.deleteAdminNews(article.id);
    await loadAll();
    notice.value = "文章已删除";
  } catch (err) {
    error.value = errorMessage(err);
  }
}

async function saveTrim(trim: AdminTrim): Promise<void> {
  const wan = Number(trimDrafts.value[trim.id]);
  if (!Number.isFinite(wan) || wan <= 0) {
    error.value = "请输入有效的价格（万元）";
    return;
  }
  updating.value = "trim-" + trim.id;
  error.value = "";
  notice.value = "";
  try {
    await api.updateAdminTrim(trim.id, Math.round(wan * 1_000_000));
    await loadAll();
    notice.value = `${trim.name} 价格已更新`;
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    updating.value = "";
  }
}

async function saveStore(store: Store): Promise<void> {
  const draft = storeDrafts.value[store.id];
  if (!draft) return;
  updating.value = "store-" + store.id;
  error.value = "";
  notice.value = "";
  try {
    await api.updateAdminStore(store.id, draft);
    await loadAll();
    notice.value = `${store.name} 已更新`;
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    updating.value = "";
  }
}

async function logout(): Promise<void> {
  await auth.logout();
  await router.push("/");
}

function formatDate(value: string): string {
  const date = new Date(value.length === 10 ? value + "T00:00:00+08:00" : value);
  if (Number.isNaN(date.getTime())) return value;
  if (value.length === 10) {
    return date.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" });
  }
  return date.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(async () => {
  const user = await auth.loadMe();
  if (!user) {
    await router.replace({ name: "login", query: { redirect: "/admin" } });
    return;
  }
  if (user.role !== "admin") {
    denied.value = true;
    ready.value = true;
    return;
  }
  ready.value = true;
  await loadAll();
});
</script>

<template>
  <div class="admin-page">
    <div class="container admin-head">
      <div>
        <p class="eyebrow">管理后台</p>
        <h1 class="page-title">运营工作台</h1>
        <p class="page-sub">订单、试驾线索与经营概览。演示环境，所有数据为本地种子数据。</p>
      </div>
      <RouterLink to="/" class="btn btn--ghost btn--sm">返回前台</RouterLink>
    </div>

    <div v-if="!ready" class="container admin-state">正在验证管理员身份…</div>

    <div v-else-if="denied" class="container admin-denied">
      <p class="eyebrow">无权限</p>
      <h2 class="section-title">这里只对管理员开放</h2>
      <p class="page-sub">当前账号不是管理员。请用管理员账号登录，或返回前台继续看车。</p>
      <div class="admin-denied__actions">
        <RouterLink to="/login" class="btn btn--primary">用管理员账号登录</RouterLink>
        <RouterLink to="/" class="btn btn--ghost">返回首页</RouterLink>
      </div>
    </div>

    <div v-else class="container admin-shell">
      <aside class="admin-nav">
        <button
          v-for="item in tabs"
          :key="item.id"
          type="button"
          class="admin-nav__btn"
          :class="{ 'admin-nav__btn--active': tab === item.id }"
          @click="tab = item.id"
        >
          {{ item.label }}
        </button>
        <div class="admin-nav__foot">
          <span class="admin-nav__user">{{ auth.user?.name }}</span>
          <button type="button" class="admin-nav__logout" @click="logout">退出登录</button>
        </div>
      </aside>

      <main class="admin-main">
        <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
        <p v-else-if="notice" class="admin-notice" role="status">{{ notice }}</p>

        <template v-if="tab === 'overview'">
          <div v-if="loading" class="admin-state">正在读取经营数据…</div>
          <template v-else-if="summary">
            <div class="admin-cards">
              <article class="admin-card">
                <p>订单总数</p>
                <strong class="num">{{ summary.orders }}</strong>
              </article>
              <article class="admin-card">
                <p>实收定金</p>
                <strong class="num">{{ money(summary.revenuePaid) }}</strong>
              </article>
              <article class="admin-card">
                <p>试驾线索</p>
                <strong class="num">{{ summary.leads }}</strong>
              </article>
              <article class="admin-card">
                <p>在售车型</p>
                <strong class="num">{{ summary.models }}</strong>
              </article>
            </div>

            <section class="admin-block">
              <div class="section-head">
                <div>
                  <p class="eyebrow">订单状态</p>
                  <h2 class="section-title">漏斗</h2>
                </div>
              </div>
              <div class="status-grid">
                <div v-for="(count, status) in summary.byStatus" :key="status" class="status-row">
                  <span>{{ statusLabels[status as OrderStatus] ?? status }}</span>
                  <span class="num">{{ count }}</span>
                </div>
              </div>
            </section>

            <p class="admin-hint">提示：订单列表里可以把「已支付」推进到「已确认 / 已交付」，或取消未交付订单。</p>
          </template>
        </template>

        <template v-else-if="tab === 'orders'">
          <div class="section-head">
            <div>
              <p class="eyebrow">订单</p>
              <h2 class="section-title">全部订单</h2>
            </div>
            <button type="button" class="btn btn--ghost btn--sm" :disabled="loading" @click="loadAll">刷新</button>
          </div>

          <div v-if="loading" class="admin-state">正在读取订单…</div>
          <div v-else-if="orders.length === 0" class="admin-state">还没有订单。</div>
          <div v-else class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>车型</th>
                  <th>客户</th>
                  <th>金额</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in orders" :key="order.orderNo">
                  <td class="num admin-table__no">{{ order.orderNo }}</td>
                  <td>{{ order.config.model.name }} · {{ order.config.trim.name }}</td>
                  <td>{{ order.customerName }}<br /><span class="admin-table__muted">{{ order.phone }}</span></td>
                  <td class="num">{{ money(order.total) }}</td>
                  <td><span class="status" :class="'status--' + order.status">{{ statusLabels[order.status] }}</span></td>
                  <td class="admin-table__actions">
                    <button
                      v-if="order.status === 'paid'"
                      type="button"
                      class="btn btn--ghost btn--sm"
                      :disabled="updating === order.orderNo"
                      @click="setStatus(order, 'confirmed')"
                    >
                      确认订单
                    </button>
                    <button
                      v-if="order.status === 'confirmed'"
                      type="button"
                      class="btn btn--ghost btn--sm"
                      :disabled="updating === order.orderNo"
                      @click="setStatus(order, 'delivered')"
                    >
                      标记交付
                    </button>
                    <button
                      v-if="order.status === 'pending_payment' || order.status === 'paid'"
                      type="button"
                      class="btn btn--ghost btn--sm admin-table__danger"
                      :disabled="updating === order.orderNo"
                      @click="setStatus(order, 'cancelled')"
                    >
                      取消
                    </button>
                    <span v-if="order.status === 'delivered' || order.status === 'cancelled'" class="admin-table__muted">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template v-else-if="tab === 'news'">
          <div class="section-head">
            <div>
              <p class="eyebrow">内容</p>
              <h2 class="section-title">新闻管理</h2>
            </div>
            <button type="button" class="btn btn--ghost btn--sm" @click="resetNewsForm">新建文章</button>
          </div>

          <div class="admin-news-layout">
            <div class="admin-news-list">
              <article v-for="article in adminNews" :key="article.id" class="admin-news-item">
                <div>
                  <p class="admin-news-item__meta">
                    <span class="num">{{ formatDate(article.publishedAt) }}</span>
                    <span>{{ article.tag }}</span>
                    <span :class="article.status === 'published' ? 'admin-news-item__live' : 'admin-news-item__draft'">
                      {{ article.status === "published" ? "已发布" : "草稿" }}
                    </span>
                  </p>
                  <h3 class="admin-news-item__title">{{ article.title }}</h3>
                  <p class="admin-news-item__summary">{{ article.summary }}</p>
                </div>
                <div class="admin-news-item__actions">
                  <button type="button" class="btn btn--ghost btn--sm" @click="editNews(article)">编辑</button>
                  <button type="button" class="btn btn--ghost btn--sm admin-table__danger" @click="removeNews(article)">删除</button>
                </div>
              </article>
            </div>

            <form class="admin-news-form" @submit.prevent="saveNews">
              <h3>{{ newsForm.id > 0 ? "编辑文章" : "新建文章" }}</h3>
              <label class="admin-field">
                <span>标题</span>
                <input v-model="newsForm.title" class="admin-input" required maxlength="120" />
              </label>
              <div class="admin-news-form__row">
                <label class="admin-field">
                  <span>标签</span>
                  <input v-model="newsForm.tag" class="admin-input" required maxlength="20" />
                </label>
                <label class="admin-field">
                  <span>状态</span>
                  <select v-model="newsForm.status" class="admin-input">
                    <option value="published">已发布</option>
                    <option value="draft">草稿</option>
                  </select>
                </label>
              </div>
              <label class="admin-field">
                <span>发布日期</span>
                <input v-model="newsForm.publishedAt" class="admin-input" type="date" required />
              </label>
              <label class="admin-field">
                <span>摘要</span>
                <textarea v-model="newsForm.summary" class="admin-input admin-textarea" required maxlength="300"></textarea>
              </label>
              <label class="admin-field">
                <span>正文（段落用空行分隔）</span>
                <textarea v-model="newsForm.body" class="admin-input admin-textarea admin-textarea--body" required maxlength="10000"></textarea>
              </label>
              <div class="admin-news-form__actions">
                <button type="submit" class="btn btn--primary btn--sm">{{ newsForm.id > 0 ? "保存修改" : "发布文章" }}</button>
                <button v-if="newsForm.id > 0" type="button" class="btn btn--ghost btn--sm" @click="resetNewsForm">取消编辑</button>
              </div>
            </form>
          </div>
        </template>

        <template v-else-if="tab === 'models'">
          <div class="section-head">
            <div>
              <p class="eyebrow">车型价格</p>
              <h2 class="section-title">版本与指导价</h2>
            </div>
            <button type="button" class="btn btn--ghost btn--sm" :disabled="loading" @click="loadAll">刷新</button>
          </div>

          <div v-if="loading" class="admin-state">正在读取车型…</div>
          <div v-else class="admin-models">
            <section v-for="model in adminModels" :key="model.id" class="admin-model">
              <header class="admin-model__head">
                <div>
                  <p class="eyebrow">{{ model.enName }}</p>
                  <h3 class="admin-model__name">{{ model.name }}</h3>
                </div>
                <span class="admin-model__from num">{{ money(model.priceFrom) }} 起</span>
              </header>
              <div class="admin-table-wrap">
                <table class="admin-table">
                  <thead>
                    <tr><th>版本</th><th>续航</th><th>零百</th><th>价格（万元）</th><th></th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="trim in model.trims" :key="trim.id">
                      <td>{{ trim.name }}</td>
                      <td class="num">{{ trim.rangeKm }} km</td>
                      <td class="num">{{ trim.zero100 }} s</td>
                      <td><input v-model="trimDrafts[trim.id]" class="admin-input" type="number" min="10" max="500" step="0.1" /></td>
                      <td>
                        <button type="button" class="btn btn--ghost btn--sm" :disabled="updating === 'trim-' + trim.id" @click="saveTrim(trim)">
                           保存
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </template>

        <template v-else-if="tab === 'stores'">
          <div class="section-head">
            <div>
              <p class="eyebrow">门店</p>
              <h2 class="section-title">门店信息</h2>
            </div>
            <button type="button" class="btn btn--ghost btn--sm" :disabled="loading" @click="loadAll">刷新</button>
          </div>

          <div v-if="loading" class="admin-state">正在读取门店…</div>
          <div v-else class="admin-stores">
            <section v-for="store in adminStores" :key="store.id" class="admin-store">
              <header class="admin-store__head">
                <p class="eyebrow">{{ store.city }}</p>
                <h3 class="admin-store__name">{{ store.name }}</h3>
              </header>
              <label class="admin-field">
                <span>地址</span>
                <input v-model="storeDrafts[store.id].address" class="admin-input" maxlength="120" />
              </label>
              <label class="admin-field">
                <span>电话</span>
                <input v-model="storeDrafts[store.id].phone" class="admin-input" maxlength="30" />
              </label>
              <label class="admin-field">
                <span>营业时间</span>
                <input v-model="storeDrafts[store.id].hours" class="admin-input" maxlength="40" />
              </label>
              <button type="button" class="btn btn--primary btn--sm" :disabled="updating === 'store-' + store.id" @click="saveStore(store)">
                保存门店
              </button>
            </section>
          </div>
        </template>

        <template v-else-if="tab === 'leads'">
          <div class="section-head">
            <div>
              <p class="eyebrow">线索</p>
              <h2 class="section-title">试驾预约</h2>
            </div>
            <button type="button" class="btn btn--ghost btn--sm" :disabled="loading" @click="loadAll">刷新</button>
          </div>

          <div v-if="loading" class="admin-state">正在读取线索…</div>
          <div v-else-if="leads.length === 0" class="admin-state">还没有试驾预约。</div>
          <div v-else class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>客户</th>
                  <th>城市</th>
                  <th>门店</th>
                  <th>期望时间</th>
                  <th>预约状态</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="lead in leads" :key="lead.id">
                  <td>{{ lead.name }}<br /><span class="admin-table__muted">{{ lead.phone }}</span></td>
                  <td>{{ lead.city ?? "—" }}</td>
                  <td>{{ lead.storeName }}</td>
                  <td class="num">{{ lead.appointment?.slot ?? "—" }}</td>
                  <td>{{ lead.appointment?.status === "pending" ? "待确认" : lead.appointment?.status ?? "—" }}</td>
                  <td class="num">{{ formatDate(lead.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  padding-block: var(--space-6) var(--space-4);
}

.admin-state {
  padding: var(--space-6);
  color: var(--muted);
  font-size: 13px;
}

.admin-denied {
  max-width: 640px;
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.admin-denied__actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.admin-shell {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: var(--space-5);
  align-items: start;
  padding-bottom: var(--space-8);
}

.admin-nav {
  position: sticky;
  top: calc(var(--header-height) + var(--space-4));
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.admin-nav__btn {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  text-align: left;
  color: var(--muted);
  font-size: 13px;
}

.admin-nav__btn:hover,
.admin-nav__btn--active {
  background: rgba(78, 177, 221, 0.08);
  color: var(--accent);
}

.admin-nav__foot {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--line);
}

.admin-nav__user {
  color: var(--text);
  font-size: 12px;
}

.admin-nav__logout {
  text-align: left;
  color: var(--muted);
  font-size: 11px;
}

.admin-nav__logout:hover {
  color: var(--danger);
}

.admin-main {
  min-width: 0;
}

.admin-error,
.admin-notice {
  margin-bottom: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.admin-error {
  border: 1px solid rgba(224, 108, 117, 0.4);
  color: var(--danger);
}

.admin-notice {
  border: 1px solid rgba(111, 207, 151, 0.35);
  color: var(--ok);
}

.admin-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.admin-card {
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.admin-card p {
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.1em;
}

.admin-card strong {
  display: block;
  margin-top: var(--space-2);
  font-size: 26px;
  color: var(--accent);
}

.admin-block {
  margin-top: var(--space-6);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2) var(--space-5);
  max-width: 520px;
  margin-top: var(--space-4);
}

.status-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}

.admin-hint {
  margin-top: var(--space-5);
  color: var(--muted);
  font-size: 12px;
}

.admin-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}

.admin-table th,
.admin-table td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--line);
  text-align: left;
  font-size: 12px;
  vertical-align: top;
}

.admin-table th {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: var(--muted);
  background: var(--surface-2);
}

.admin-table__no {
  font-size: 11px;
  color: var(--accent-2);
}

.admin-table__muted {
  color: var(--muted);
  font-size: 11px;
}

.admin-table__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.admin-table__danger {
  color: var(--danger);
  border-color: rgba(224, 108, 117, 0.35);
}

.status {
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  font-size: 10px;
  color: var(--muted);
}

.status--paid,
.status--confirmed,
.status--delivered {
  border-color: rgba(111, 207, 151, 0.4);
  color: var(--ok);
}

.status--pending_payment {
  border-color: rgba(78, 177, 221, 0.5);
  color: var(--accent);
}

@media (max-width: 900px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .admin-nav {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .admin-nav__foot {
    flex-direction: row;
    align-items: center;
    margin-top: 0;
    margin-left: auto;
    padding-top: 0;
    border-top: 0;
  }

  .admin-cards {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 560px) {
  .admin-cards {
    grid-template-columns: 1fr;
  }
}

.admin-models {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-model {
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.admin-model__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.admin-model__name {
  font-size: 22px;
}

.admin-model__from {
  color: var(--accent);
  font-size: 13px;
}

.admin-input {
  width: 100%;
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text);
  font-size: 12px;
  outline: none;
}

.admin-input:focus {
  border-color: var(--accent);
}

.admin-stores {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.admin-store {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.admin-store__head {
  margin-bottom: var(--space-2);
}

.admin-store__name {
  margin-top: 4px;
  font-size: 18px;
}

.admin-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.admin-field span {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
}

@media (max-width: 900px) {
  .admin-stores {
    grid-template-columns: 1fr;
  }
}

.admin-news-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: var(--space-4);
  align-items: start;
}

.admin-news-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.admin-news-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.admin-news-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.admin-news-item__live {
  color: var(--ok);
}

.admin-news-item__draft {
  color: var(--accent);
}

.admin-news-item__title {
  margin-top: 6px;
  font-size: 18px;
}

.admin-news-item__summary {
  max-width: 60ch;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.admin-news-item__actions {
  display: flex;
  gap: 6px;
  align-items: flex-start;
}

.admin-news-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.admin-news-form h3 {
  font-size: 18px;
}

.admin-news-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.admin-textarea {
  min-height: 80px;
  padding: 10px;
  resize: vertical;
  line-height: 1.7;
}

.admin-textarea--body {
  min-height: 180px;
}

.admin-news-form__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

@media (max-width: 1100px) {
  .admin-news-layout {
    grid-template-columns: 1fr;
  }
}
</style>