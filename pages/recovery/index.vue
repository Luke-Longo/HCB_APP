<template>
	<AuthRecoveryCard />
</template>

<script setup lang="ts"></script>

<style scoped>
.max-width {
	max-width: 600px;
	margin: 0 auto;
}
.card h3 {
	font-size: 3rem;
	padding: 0rem 0 1rem 0;
	text-align: center;
}
.form-group label {
	display: block;
	margin: 0.5rem 0;
	text-align: center;
}
.form-group input {
	width: 100%;
	padding: 0.5rem;
	border: 1px solid #ccc;
	border-radius: 3px;
}
.form-group button {
	width: 100%;
	padding: 0.5rem;
	border: 1px solid #ccc;
	border-radius: 5px;
	margin: 2rem 0 0 0;
}
.form-group p {
	text-align: center;
	margin: 1rem 0;
}
.link {
	text-decoration: underline;
	cursor: pointer;
}
.link:hover {
	color: var(--hover-color);
}
#invalid {
	color: rgb(255, 108, 108);
	text-align: center;
	margin: 1rem 0;
}
.btn:hover {
	background-color: var(--hover-color);
	color: white;
}
</style>
