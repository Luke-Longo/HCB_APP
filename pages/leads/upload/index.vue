<template>
	<div>
		<h3 class="header">Upload Leads</h3>
		<div class="flex flex-col gap-8">
			<div class="my-6">
				<UiRadio v-model="leadProvider" :radio-types="providerTypes" />
			</div>
			<transition name="fade" mode="out-in">
				<div class="flex justify-center gap-4" v-if="leadProvider === 'other'">
					<label for="">Other: </label>
					<input type="text" v-model="otherProviderInput" />
				</div>
			</transition>
			<div class="my-6">
				<UiRadio v-model="leadType" :radio-types="leadTypes" />
			</div>
			<transition name="fade" mode="out-in">
				<div class="flex justify-center gap-4" v-if="leadType === 'other'">
					<label for="">Other: </label>
					<input type="text" v-model="otherLeadTypeInput" />
				</div>
			</transition>
			<div>
				<UiImporter
					:label="'Leads'"
					:composable="useFormattedLeads"
					:redirect="'/leads'"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useLeadStore } from "~/stores/lead";

const leadProvider = ref("propStream");

const otherProviderInput = ref("");

const providerTypes = [
	{
		label: "PropStream",
		id: "propStream",
	},
	{
		label: "Foreclosure Daily",
		id: "foreclosureDaily",
	},
	{
		label: "Fiverr",
		id: "fiverr",
	},
	{
		label: "Other",
		id: "other",
	},
];

const leadType = ref("foreclosure");

const otherLeadTypeInput = ref("");

const leadTypes = [
	{
		label: "Foreclosure",
		id: "foreclosure",
	},
	{
		label: "Probate",
		id: "probate",
	},
	{
		label: "Divorce",
		id: "divorce",
	},
	{
		label: "High Equity",
		id: "highEquity",
	},
	{
		label: "Other",
		id: "other",
	},
];

const leadStore = useLeadStore();

onMounted(() => {
	leadStore.setLeadProvider("propStream");
	leadStore.setLeadType("foreclosure");
});

watch(leadProvider, (newProvider) => {
	leadStore.setLeadProvider(newProvider);
});

watch(leadType, (newType) => {
	leadStore.setLeadType(newType);
});

watch(otherProviderInput, (newProvider) => {
	leadStore.setLeadProvider(newProvider);
});

watch(otherLeadTypeInput, (newType) => {
	leadStore.setLeadType(newType);
});
</script>
