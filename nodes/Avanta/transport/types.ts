import type {IDataObject} from 'n8n-workflow';

export interface Customer {
	custom_attributes?: CustomAttribute[];
	dob?: string;
	email: string;
	firstname: string;
	gender?: number;
	group_id?: number;
	lastname: string;
	middlename?: string;
	password?: string;
	prefix?: string;
	proline_customer_id: string;
	store_id?: number;
	suffix?: string;
	website_id?: number;
}

export interface CompanyCustomerLink {
	company_customer_id: string;
	company_role_external_id: string;
}

export type CompanyCustomer = {
	company_customer_linkage: CompanyCustomerLink[],
	user: Customer
}

export interface Company {
	customer_id: string;
	name: string;
	status: number;
	alias?: string;
	company_role_id?: number;
	telephone?: string;
	vat_id?: string;
	duns?: string;
	email?: string;
	group_id?: number;
	interim_account?: number;
	internet?: string;
	logo?: string;
	extension_attributes?: ExtensionAttributes;
}

export interface ExtensionAttributes {
	[key: string]: string;
}

export interface Address {
	address_type: number;
	external_address_id: string;
	region?: Region;
	region_id?: number;
	country_id?: string;
	street?: string[];
	company?: string;
	telephone?: string;
	fax?: string;
	postcode?: string;
	city?: string;
	vat_id?: string;
	is_default?: number;
	is_readonly?: number;
	extension_attributes?: AddressExtensionAttributes;
	custom_attributes?: CustomAttribute[];
}

export interface CustomAttribute {
	attribute_code?: string;
	value?: string;
}

export interface AddressExtensionAttributes {
	amazon_id?: string;
	is_subscribed?: boolean;
	vertex_customer_role?: string;
	vertex_customer_country?: string;
}

export interface Region {
	region_code?: string;
	region?: string;
	region_id?: number;
	extension_attributes?: AddressExtensionAttributes;
}

export interface CustomerExtensionAttributes {
	company_attributes?: CompanyAttributes;
	is_subscribed?: boolean;
	amazon_id?: string;
	vertex_customer_code?: string;
	vertex_customer_country?: string;
}

export interface CompanyAttributes {
	customer_id?: number;
	company_id?: number;
	job_title?: string;
	status?: number;
	telephone?: string;
	extension_attributes?: AddressExtensionAttributes;
}

export interface CustomerAttributeMetadata {
	frontend_input?: string;
	input_filter?: string;
	store_label?: string;
	validation_rules?: ValidationRule[];
	multiline_count?: number;
	visible?: boolean;
	required?: boolean;
	data_model?: string;
	options?: CustomerAttributeMetadataOption[];
	frontend_class?: string;
	user_defined?: boolean;
	sort_order?: number;
	frontend_label?: string;
	note?: string;
	system?: boolean;
	backend_type?: string;
	is_used_in_grid?: boolean;
	is_visible_in_grid?: boolean;
	is_filterable_in_grid?: boolean;
	is_searchable_in_grid?: boolean;
	attribute_code?: string;
}

export interface CustomerAttributeMetadataOption {
	label?: string;
	value?: string;
	options?: IDataObject[];
}

export interface ValidationRule {
	name?: string;
	value?: string;
}

export interface Search {
	search_criteria?: SearchCriteria;
	total_count?: number;
}

export interface SearchCriteria {
	filter_groups?: FilterGroup[];
	sort_orders?: SortOrder[];
	page_size?: number;
	current_page?: number;
}

export interface FilterGroup {
	filters?: Filter[];
}

export interface Filter {
	field?: string;
	value?: string;
	condition_type?: string;
}

export interface SortOrder {
	field?: string;
	direction?: string;
}

export interface NewProduct {
	product?: Product;
	saveOptions?: boolean;
}

export interface Product {
	id?: number;
	sku?: string;
	name?: string;
	attribute_set_id?: number;
	price?: number;
	status?: number;
	visibility?: number;
	type_id?: string;
	created_at?: string;
	updated_at?: string;
	weight?: number;
	extension_attributes?: {
		category_links?: [
			{
				category_id?: string;
			},
		];
	};
	custom_attributes?: CustomAttribute[];
}

export interface ProductAttribute {
	is_filterable_in_search: boolean;
	default_frontend_label: string;
	attribute_id: string;
	is_filterable: boolean;
	used_for_sort_by: boolean;
	is_searchable: string;
	attribute_code: string;
}
