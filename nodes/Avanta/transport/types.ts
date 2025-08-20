import type {IDataObject} from 'n8n-workflow';

export interface Customer {
	custom_attributes?: CustomAttribute[];
	dob?: string;
	email: string;
	firstname?: string;
	gender?: number;
	group_id?: number;
	lastname?: string;
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
	withPositions?: boolean;
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
		website_ids?: number[];
		stock_item?: {
			qty?: string;
			is_in_stock?: number;
		};
		external_category_links?: {
			external_category_id?: string;
		}[];
	};
	custom_attributes?: CustomAttribute[];
	dynamic_custom_attributes?: DynamicCustomAttribute[];
	product_symbols?: ProductSymbol[];
	dynamic_media_gallery_entries?: MediaGalleryEntry[];
	download_items?: DownloadItem[];
	product_links?: ProductLink[];
}

export interface DynamicCustomAttribute {
	attribute_code?: string;
	value?: string | Array<{key: string, value: string}>;
}

export interface ProductSymbol {
	extension_attributes?: {
		sku?: string;
		symbol_codes?: string[];
	};
	store_id?: number;
}

export interface MediaGalleryEntry {
	media_type?: string;
	position?: number;
	disabled?: boolean;
	label?: string;
	scope?: string;
	types?: string[];
	file?: string;
	content?: {
		content?: string;
		name?: string;
	};
}

export interface DownloadItem {
	status?: number;
	show_in_portal?: number;
	title?: string;
	external_id?: string;
	visibility?: number;
	product_all?: number;
	filename?: string;
    description?: string;
    short_description?: string;
    company_ids?: number[];
    category_ids?: number[];
    company_group_ids?: string;
    item_dir?: string;
    preview?: string;
    extracted_text?: string;
    type?: string;
    url?: string;
	extension_attributes?: {
		content?: string;
		store_id?: number;
		external_category_ids?: string[];
		external_company_ids?: string[];
		skus?: string[];
	};
}

export interface ProductLink {
	sku?: string;
	linked_product_sku?: string;
	link_type?: string;
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

export interface DocumentFile {
	document_id?: string;
	type?: string;
	file?: string;
	date?: string;
}

export interface ReorderData {
	id?: number;
	packaging_unit?: string;
	qty?: number;
	sku?: string;
}

export interface OrderItem {
	item_pos: number;
	name: string;
	price: number;
	qty: number;
	sku: string;
	subtotal: number;
	order_item_id?: number;
	order_id?: number;
	status?: string;
	company_sku?: string;
	packaging_unit?: string;
	tax_percent?: number;
	tax_amount?: number;
	discount?: number;
	ean?: string;
	batch_no?: string;
	comment?: string;
	custom_price1?: number;
	custom_price2?: number;
	custom_qty1?: number;
	custom_qty2?: number;
	custom_text1?: string;
	custom_text2?: string;
	custom_date1?: string;
	custom_date2?: string;
	desired_date?: string;
	document_files?: DocumentFile[];
	reorder_data?: ReorderData;
	extension_attributes?: any;
}

export interface OrderReport {
	customer_id: string;
	company_id: number;
	customer_orderid: string;
	order_positions: OrderItem[];
	billing_city?: string;
	billing_company?: string;
	billing_country?: string;
	billing_email?: string;
	billing_name?: string;
	billing_street?: string;
	billing_telephone?: string;
	billing_zip?: string;
	comment?: string;
	custom_date1?: string;
	custom_date2?: string;
	custom_orderid?: string;
	custom_price1?: number;
	custom_price2?: number;
	custom_text1?: string;
	custom_text2?: string;
	customer_comment?: string;
	deliverydate?: string;
	desired_deliverydate?: string;
	document_files?: DocumentFile[];
	external_id?: string;
	grand_total?: number;
	order_date?: string;
	order_id?: number;
	purchaser?: string;
	shipping_city?: string;
	shipping_company?: string;
	shipping_country?: string;
	shipping_email?: string;
	shipping_name?: string;
	shipping_street?: string;
	shipping_telephone?: string;
	shipping_zip?: string;
	status?: string;
	tax_amount?: number;
	extension_attributes?: any;
}

export interface ShipmentItem {
	item_pos: number;
	name: string;
	price: number;
	qty: number;
	sku: string;
	subtotal: number;
	shipment_item_id?: number;
	shipment_id?: number;
	status?: string;
	company_sku?: string;
	packaging_unit?: string;
	tax_percent?: number;
	tax_amount?: number;
	discount?: number;
	ean?: string;
	batch_no?: string;
	comment?: string;
	custom_price1?: number;
	custom_price2?: number;
	custom_qty1?: number;
	custom_qty2?: number;
	custom_text1?: string;
	custom_text2?: string;
	custom_date1?: string;
	custom_date2?: string;
	desired_date?: string;
	document_files?: DocumentFile[];
	extension_attributes?: any;
}

export interface ShipmentReport {
	customer_id: string;
	company_id: number;
	customer_shipmentid: string;
	shipment_positions: ShipmentItem[];
	customer_orderid?: string;
	shipment_id?: number;
	shipment_date?: string;
	order_id?: number;
	status?: string;
	grand_total?: number;
	tax_amount?: number;
	shipping_company?: string;
	shipping_name?: string;
	shipping_street?: string;
	shipping_zip?: string;
	shipping_city?: string;
	shipping_country?: string;
	shipping_telephone?: string;
	shipping_email?: string;
	custom_price1?: number;
	custom_price2?: number;
	custom_text1?: string;
	custom_text2?: string;
	custom_date1?: string;
	custom_date2?: string;
	external_id?: string;
	document_files?: DocumentFile[];
	extension_attributes?: any;
}

export interface ReshipmentItem {
	item_pos: number;
	name: string;
	price: number;
	qty: number;
	sku: string;
	subtotal: number;
	reshipment_item_id?: number;
	reshipment_id?: number;
	status?: string;
	company_sku?: string;
	packaging_unit?: string;
	tax_percent?: number;
	tax_amount?: number;
	discount?: number;
	ean?: string;
	batch_no?: string;
	comment?: string;
	custom_price1?: number;
	custom_price2?: number;
	custom_qty1?: number;
	custom_qty2?: number;
	custom_text1?: string;
	custom_text2?: string;
	custom_date1?: string;
	custom_date2?: string;
	desired_date?: string;
	document_files?: DocumentFile[];
	extension_attributes?: any;
}

export interface ReshipmentReport {
	customer_id: string;
	company_id: number;
	customer_reshipmentid: string;
	reshipment_positions: ReshipmentItem[];
	customer_orderid?: string;
	reshipment_id?: number;
	reshipment_date?: string;
	status?: string;
	grand_total?: number;
	tax_amount?: number;
	billing_company?: string;
	billing_name?: string;
	billing_street?: string;
	billing_zip?: string;
	billing_city?: string;
	billing_country?: string;
	billing_telephone?: string;
	billing_email?: string;
	custom_price1?: number;
	custom_price2?: number;
	custom_text1?: string;
	custom_text2?: string;
	custom_date1?: string;
	custom_date2?: string;
	external_id?: string;
	document_files?: DocumentFile[];
	extension_attributes?: any;
}

export interface BackorderItem {
	item_pos: number;
	name: string;
	price: number;
	qty: number;
	sku: string;
	subtotal: number;
	backorder_item_id?: number;
	backorder_id?: number;
	status?: string;
	company_sku?: string;
	packaging_unit?: string;
	tax_percent?: number;
	tax_amount?: number;
	discount?: number;
	ean?: string;
	batch_no?: string;
	comment?: string;
	commission?: string;
	custom_price1?: number;
	custom_price2?: number;
	custom_qty1?: number;
	custom_qty2?: number;
	custom_text1?: string;
	custom_text2?: string;
	custom_date1?: string;
	custom_date2?: string;
	desired_date?: string;
	estimated_delivery_date?: string;
	document_files?: DocumentFile[];
	extension_attributes?: any;
}

export interface BackorderReport {
	customer_id: string;
	company_id: number;
	customer_orderid: string;
	backorder_positions: BackorderItem[];
	backorder_date?: string;
	backorder_id?: number;
	status?: string;
	billing_city?: string;
	billing_company?: string;
	billing_country?: string;
	billing_email?: string;
	billing_name?: string;
	billing_street?: string;
	billing_telephone?: string;
	billing_zip?: string;
	comment?: string;
	custom_date1?: string;
	custom_date2?: string;
	custom_price1?: number;
	custom_price2?: number;
	custom_text1?: string;
	custom_text2?: string;
	external_id?: string;
	shipping_city?: string;
	shipping_company?: string;
	shipping_country?: string;
	shipping_email?: string;
	shipping_name?: string;
	shipping_street?: string;
	shipping_telephone?: string;
	shipping_zip?: string;
	document_files?: DocumentFile[];
	extension_attributes?: any;
}

export interface InvoiceItem {
	item_pos: number;
	name: string;
	price: number;
	qty: number;
	sku: string;
	subtotal: number;
	invoice_item_id?: number;
	invoice_id?: number;
	status?: string;
	company_sku?: string;
	packaging_unit?: string;
	tax_percent?: number;
	tax_amount?: number;
	discount?: number;
	ean?: string;
	batch_no?: string;
	comment?: string;
	custom_price1?: number;
	custom_price2?: number;
	custom_qty1?: number;
	custom_qty2?: number;
	custom_text1?: string;
	custom_text2?: string;
	custom_date1?: string;
	custom_date2?: string;
	desired_date?: string;
	document_files?: DocumentFile[];
	extension_attributes?: any;
}

export interface InvoiceReport {
	customer_id: string;
	company_id: number;
	billing_company: string;
	billing_name: string;
	customer_invoiceid: string;
	status: string;
	invoice_positions: InvoiceItem[];
	billing_city?: string;
	billing_country?: string;
	billing_email?: string;
	billing_street?: string;
	billing_telephone?: string;
	billing_zip?: string;
	customer_orderid?: string;
	custom_date1?: string;
	custom_date2?: string;
	custom_price1?: number;
	custom_price2?: number;
	custom_text1?: string;
	custom_text2?: string;
	external_id?: string;
	grand_total?: number;
	invoice_date?: string;
	invoice_id?: number;
	shipping_city?: string;
	shipping_company?: string;
	shipping_country?: string;
	shipping_email?: string;
	shipping_name?: string;
	shipping_street?: string;
	shipping_telephone?: string;
	shipping_zip?: string;
	tax_amount?: number;
	document_files?: DocumentFile[];
	extension_attributes?: any;
}

export interface CreditmemoItem {
	item_pos: number;
	name: string;
	price: number;
	qty: number;
	sku: string;
	subtotal: number;
	creditmemo_item_id?: number;
	creditmemo_id?: number;
	batch_no?: string;
	comment?: string;
	company_sku?: string;
	custom_date1?: string;
	custom_date2?: string;
	custom_price1?: number;
	custom_price2?: number;
	custom_qty1?: number;
	custom_qty2?: number;
	custom_text1?: string;
	custom_text2?: string;
	desired_date?: string;
	discount?: number;
	ean?: string;
	tax_amount?: number;
	tax_percent?: number;
	document_files?: DocumentFile[];
	extension_attributes?: any;
}

export interface CreditmemoReport {
	customer_id: string;
	company_id: number;
	billing_company: string;
	billing_name: string;
	customer_creditmemoid: string;
	status?: string;
	creditmemo_positions: CreditmemoItem[];
	billing_city?: string;
	billing_country?: string;
	billing_email?: string;
	billing_street?: string;
	billing_telephone?: string;
	billing_zip?: string;
	customer_orderid?: string;
	custom_date1?: string;
	custom_date2?: string;
	custom_price1?: number;
	custom_price2?: number;
	custom_text1?: string;
	custom_text2?: string;
	creditmemo_date?: string;
	creditmemo_id?: number;
	external_id?: string;
	grand_total?: number;
	tax_amount?: number;
	document_files?: DocumentFile[];
	extension_attributes?: any;
}

export interface TrackingReport {
	company_id: number;
	tracking_code: string;
	company_customer_id?: string;
	created_at?: string;
	customer_orderid?: string;
	customer_shipmentid?: string;
	notice?: string;
	order_id?: number;
	provider?: string;
	shipment_id?: number;
	store_code?: string;
	tracking_date?: string;
	tracking_id?: number;
	updated_at?: string;
}

export interface SalesOrg {
	name: string;
	agreement_ids: string[];
	agreement_identifier?: string;
	alias?: string;
	business_hours?: string;
	ceo?: string;
	city?: string;
	company?: string;
	country_id?: string;
	email?: string;
	external_config?: string;
	external_id?: string;
	extra_content?: string;
	fax?: string;
	group_id?: number;
	postcode?: string;
	registration_court?: string;
	registration_nr?: string;
	status?: number;
	street?: string;
	tax_vat_id?: string;
	telephone?: string;
}

export interface CompanyGroup {
	external_id?: string;
	name: string;
	store_group_id: number;
}

export interface CompanyRole {
	company_id: number;
	external_id?: string;
	is_system: number;
	parent_id: number;
	role_name: string;
	role_type?: string;
}

export interface DownloadCategory {
    store_id: number;
    status: boolean;
    title: string;
    level: number;
    tree_path?: string;
    parent_category_id?: number;
    external_id?: string;
    order?: number;
}
