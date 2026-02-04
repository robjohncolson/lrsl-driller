<script lang="ts">
	import { user } from '$lib/stores';
	import { getAvatarForUsername } from '$lib/stores/user';
	import { fly, fade } from 'svelte/transition';

	interface ReviewItem {
		id: string;
		username: string;
		real_name?: string;
		class_period?: string;
		scenario?: string;
		student_answers: Record<string, string>;
		expected_answers?: Record<string, string>;
		keyword_results?: Record<string, { score: string; feedback: string }>;
		teacher_grades?: Record<string, string>;
		status: 'pending' | 'reviewed';
		fields?: string[];
		created_at?: string;
		cartridge_id?: string;
	}

	let { open = $bindable(false), onClose, onReviewWork }: {
		open: boolean;
		onClose: () => void;
		onReviewWork?: (review: ReviewItem) => void;
	} = $props();

	let filter = $state<'pending' | 'reviewed'>('pending');
	let loading = $state(true);
	let reviews = $state<ReviewItem[]>([]);
	let error = $state<string | null>(null);
	let pendingGrades = $state<Record<string, Record<string, string>>>({});

	$effect(() => {
		if (open && $user.isTeacher) {
			loadReviews();
		}
	});

	$effect(() => {
		if (open) {
			loadReviews();
		}
	});

	async function loadReviews() {
		if (!$user.serverUrl) {
			error = 'Not connected to server';
			loading = false;
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await fetch(`${$user.serverUrl}/api/teacher-review?status=${filter}`, {
				headers: { 'x-teacher-password': 'stats123' }
			});

			if (!response.ok) throw new Error('Failed to fetch');

			reviews = await response.json();
		} catch (err) {
			error = 'Failed to load reviews';
			console.error('Teacher review error:', err);
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function setGrade(reviewId: string, fieldId: string, score: string) {
		if (!pendingGrades[reviewId]) {
			pendingGrades[reviewId] = {};
		}
		pendingGrades[reviewId][fieldId] = score;
		pendingGrades = { ...pendingGrades };
	}

	function getGrade(reviewId: string, fieldId: string): string | undefined {
		return pendingGrades[reviewId]?.[fieldId];
	}

	async function submitGrades(review: ReviewItem) {
		const grades = pendingGrades[review.id];
		const fields = review.fields || Object.keys(review.student_answers || {});

		// Check all fields are graded
		for (const fieldId of fields) {
			if (!grades?.[fieldId]) {
				alert(`Please grade all fields before submitting`);
				return;
			}
		}

		try {
			const response = await fetch(`${$user.serverUrl}/api/teacher-review/${review.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'x-teacher-password': 'stats123'
				},
				body: JSON.stringify({
					grades,
					username: review.username
				})
			});

			if (response.ok) {
				// Remove from list
				reviews = reviews.filter(r => r.id !== review.id);
				delete pendingGrades[review.id];
				pendingGrades = { ...pendingGrades };
			} else {
				throw new Error('Failed to submit');
			}
		} catch (err) {
			console.error('Submit grades error:', err);
			alert('Failed to submit grades');
		}
	}

	function formatDate(dateStr?: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function getScoreClass(score: string): string {
		switch (score.toUpperCase()) {
			case 'E': return 'bg-green-500';
			case 'P': return 'bg-yellow-500';
			case 'I': return 'bg-red-500';
			default: return 'bg-gray-400';
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 z-40"
		transition:fade={{ duration: 200 }}
		onclick={onClose}
	></div>

	<div
		class="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50"
		transition:fly={{ x: 400, duration: 300 }}
	>
		<div class="h-full flex flex-col">
			<!-- Header -->
			<div class="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-2xl">📝</span>
					<h2 class="text-xl font-bold text-white">Student Reviews</h2>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="p-2 hover:bg-white/20 rounded-full transition-colors"
				>
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<!-- Filter Tabs -->
			<div class="flex border-b bg-gray-50">
				<button
					type="button"
					onclick={() => filter = 'pending'}
					class="flex-1 px-4 py-3 text-sm font-medium transition-colors {filter === 'pending' ? 'text-purple-600 border-b-2 border-purple-500 bg-white' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}"
				>
					Pending
					{#if filter === 'pending' && reviews.length > 0}
						<span class="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{reviews.length}</span>
					{/if}
				</button>
				<button
					type="button"
					onclick={() => filter = 'reviewed'}
					class="flex-1 px-4 py-3 text-sm font-medium transition-colors {filter === 'reviewed' ? 'text-purple-600 border-b-2 border-purple-500 bg-white' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}"
				>
					Reviewed
				</button>
				<button
					type="button"
					onclick={loadReviews}
					class="px-4 py-3 text-gray-500 hover:text-gray-700"
					title="Refresh"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if loading}
					<div class="flex items-center justify-center h-32">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
					</div>
				{:else if error}
					<div class="text-center text-gray-500 py-8">
						<span class="text-4xl block mb-2">📡</span>
						<p>{error}</p>
					</div>
				{:else if reviews.length === 0}
					<div class="text-center text-gray-500 py-8">
						<span class="text-4xl block mb-2">✅</span>
						<p>{filter === 'pending' ? 'No pending reviews!' : 'No reviewed items yet.'}</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each reviews as review, index (review.id)}
							{@const avatar = getAvatarForUsername(review.username)}
							{@const fields = review.fields || Object.keys(review.student_answers || {})}
							{@const isReviewed = review.status === 'reviewed'}
							<div
								class="bg-white border rounded-xl shadow-sm overflow-hidden"
								in:fly={{ y: 20, delay: index * 50, duration: 200 }}
							>
								<!-- Review Header -->
								<div class="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b">
									<span class="text-2xl">{avatar}</span>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2">
											{#if review.class_period}
												<span class="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
													{review.class_period}
												</span>
											{/if}
											<span class="font-semibold text-gray-800 truncate">{review.username}</span>
										</div>
										{#if review.real_name}
											<div class="text-xs text-gray-500">{review.real_name}</div>
										{/if}
									</div>
									<div class="text-xs text-gray-400">
										{formatDate(review.created_at)}
									</div>
								</div>

								<!-- Scenario -->
								{#if review.scenario}
									<div class="px-4 py-2 bg-purple-50 text-sm text-gray-700 border-b">
										{review.scenario}
									</div>
								{/if}

								<!-- Answers Grid -->
								<div class="p-4 space-y-3">
									{#each fields as fieldId}
										{@const studentAnswer = review.student_answers?.[fieldId] || '—'}
										{@const expected = review.expected_answers?.[fieldId]}
										{@const keywordResult = review.keyword_results?.[fieldId]}
										{@const teacherGrade = review.teacher_grades?.[fieldId]}
										{@const currentGrade = getGrade(review.id, fieldId)}

										<div class="border rounded-lg p-3 bg-gray-50">
											<div class="flex items-center justify-between mb-2">
												<span class="text-xs font-semibold text-gray-500 uppercase">{fieldId}</span>
												{#if keywordResult?.score}
													<span class="text-xs px-2 py-0.5 rounded {getScoreClass(keywordResult.score)} text-white">
														Keyword: {keywordResult.score}
													</span>
												{/if}
											</div>

											<div class="text-sm text-gray-800 mb-2">
												"{studentAnswer}"
											</div>

											{#if expected}
												<div class="text-xs text-gray-500 mb-2">
													Expected: {expected}
												</div>
											{/if}

											{#if !isReviewed}
												<!-- Grading Buttons -->
												<div class="flex gap-2 mt-2">
													<button
														type="button"
														onclick={() => setGrade(review.id, fieldId, 'E')}
														class="flex-1 py-1.5 rounded text-sm font-medium transition-colors {currentGrade === 'E' ? 'bg-green-500 text-white' : 'bg-white border border-green-500 text-green-600 hover:bg-green-50'}"
													>
														E
													</button>
													<button
														type="button"
														onclick={() => setGrade(review.id, fieldId, 'P')}
														class="flex-1 py-1.5 rounded text-sm font-medium transition-colors {currentGrade === 'P' ? 'bg-yellow-500 text-white' : 'bg-white border border-yellow-500 text-yellow-600 hover:bg-yellow-50'}"
													>
														P
													</button>
													<button
														type="button"
														onclick={() => setGrade(review.id, fieldId, 'I')}
														class="flex-1 py-1.5 rounded text-sm font-medium transition-colors {currentGrade === 'I' ? 'bg-red-500 text-white' : 'bg-white border border-red-500 text-red-600 hover:bg-red-50'}"
													>
														I
													</button>
												</div>
											{:else if teacherGrade}
												<div class="flex items-center gap-2 mt-2">
													<span class="text-xs text-gray-500">Teacher grade:</span>
													<span class="px-2 py-0.5 rounded text-xs font-bold {getScoreClass(teacherGrade)} text-white">
														{teacherGrade}
													</span>
												</div>
											{/if}
										</div>
									{/each}
								</div>

								<!-- Actions -->
								{#if !isReviewed}
									<div class="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
										{#if onReviewWork}
											<button
												type="button"
												onclick={() => onReviewWork?.(review)}
												class="text-purple-600 hover:text-purple-700 text-sm font-medium"
											>
												Review in Driller
											</button>
										{:else}
											<div></div>
										{/if}
										<button
											type="button"
											onclick={() => submitGrades(review)}
											class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
										>
											Quick Grade
										</button>
									</div>
								{:else}
									<div class="px-4 py-2 text-xs text-green-600 text-right bg-gray-50 border-t">
										Reviewed
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
