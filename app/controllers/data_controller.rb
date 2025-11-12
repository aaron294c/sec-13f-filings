class DataController < ApplicationController
  before_action :set_public_cache_header

  def autocomplete
    managers_data = ThirteenFFiler.
      autocomplete(params[:q]).
      limit(8).
      map do |f|
        {
          cik: f.cik,
          name: f.name,
          extra: "#{f.city_and_state}",
          path: "/manager/#{f.cik}"
        }
      end

    cusips_data = CompanyCusipLookup.
      autocomplete(params[:q]).
      limit(5).
      map do |c|
        {
          cusip: c.cusip,
          name: c.issuer_name,
          extra: [c.symbol, c.cusip, c.class_title.upcase].compact.join(" - "),
          path: "/cusip/#{c.cusip}"
        }
      end

    render json: {managers: managers_data, cusips: cusips_data}
  end

  def thirteen_f_data
    filing = ThirteenF.without_xml_fields.find_by!(external_id: params[:external_id])

    holdings = filing.aggregate_holdings.descend_by_value.map do |h|
      pct_of_total = if h.value
        100 * h.value.to_f / filing.holdings_value_calculated.to_f
      end

      {
        issuer_name: h.issuer_name,
        class_title: h.class_title&.upcase,
        cusip: h.cusip,
        value: h.value&.to_i,
        pct: pct_of_total&.round(1),
        shares: h.shares&.to_i,
        principal: h.principal&.to_i,
        option_type: h.option_type
      }
    end

    render json: {
      filing: {
        external_id: filing.external_id,
        cik: filing.cik,
        manager_name: filing.name,
        report_date: filing.report_date,
        report_year: filing.report_year,
        report_quarter: filing.report_quarter,
        total_value: filing.holdings_value_calculated,
        period: "Q#{filing.report_quarter} #{filing.report_year}"
      },
      data: holdings
    }
  end

  def thirteen_f_detailed_data
    filing = ThirteenF.without_xml_fields.find_by!(external_id: params[:external_id])

    holdings = filing.holdings.descend_by_value.map do |h|
      pct_of_total = if h.value
        100 * h.value.to_f / filing.holdings_value_calculated.to_f
      end

      {
        issuer_name: h.issuer_name,
        class_title: h.class_title&.upcase,
        cusip: h.cusip,
        value: h.value&.to_i,
        pct: pct_of_total&.round(1),
        shares: h.shares&.to_i,
        principal: h.principal&.to_i,
        option_type: h.option_type,
        investment_discretion: h.investment_discretion,
        other_manager: h.other_manager,
        voting_authority_sole: h.voting_authority_sole&.to_i,
        voting_authority_shared: h.voting_authority_shared&.to_i,
        voting_authority_none: h.voting_authority_none&.to_i
      }
    end

    render json: {
      filing: {
        external_id: filing.external_id,
        cik: filing.cik,
        manager_name: filing.name,
        report_date: filing.report_date,
        report_year: filing.report_year,
        report_quarter: filing.report_quarter,
        total_value: filing.holdings_value_calculated,
        period: "Q#{filing.report_quarter} #{filing.report_year}"
      },
      data: holdings
    }
  end

  def compare_holdings_data
    filing = ThirteenF.without_xml_fields.find_by!(external_id: params[:external_id])
    other_filing = ThirteenF.without_xml_fields.find_by!(external_id: params[:other_external_id])
    render json: DataTableFormatter.thirteen_f_comparison_to_datatable(filing, other_filing)
  end

  def all_cusip_holders_data
    year = params[:year].to_i
    quarter = params[:quarter].to_i

    head :bad_request unless (1..4).include?(quarter) && year <= Date.today.year

    data = DataTableFormatter.all_cusip_holdings_to_datatable(
      cusip: parsed_cusip,
      year: year,
      quarter: quarter
    )

    render json: data
  end

  def manager_cusip_history_data
    data = DataTableFormatter.manager_cusip_history_to_datatable(
      cusip: parsed_cusip,
      manager_cik: params[:cik]
    )

    render json: data
  end

  def managers_list
    page = params[:page] || 1
    per_page = params[:per_page] || 50
    search = params[:search]

    # Get all filer CIKs that have processed filings
    filers_with_filings = ThirteenF.processed.distinct.pluck(:cik)

    filers = ThirteenFFiler.
      where(cik: filers_with_filings)

    # Apply search filter if provided
    if search.present?
      filers = filers.where("name ILIKE ?", "%#{search}%")
    end

    filers = filers.
      order("lower(name), cik").
      page(page).
      per(per_page)

    render json: {
      managers: filers.map { |f|
        {
          cik: f.cik,
          name: f.name,
          city: f.city,
          state: f.state_or_country,
          location: f.city_and_state,
          path: "/manager/#{f.cik}"
        }
      },
      pagination: {
        current_page: filers.current_page,
        total_pages: filers.total_pages,
        total_count: filers.total_count,
        per_page: per_page.to_i
      }
    }
  end

  def newest_filings_data
    # Show filings for Q2 2025 (ended June 30, deadline was Aug 14)
    # Most managers have filed Q2 2025 by now
    filings = ThirteenF.
      where(report_year: 2025, report_quarter: 2).
      processed.
      without_xml_fields.
      includes(:filer).
      order(date_filed: :desc, holdings_value_calculated: :desc).
      page(params[:page] || 1).
      per(params[:per_page] || 100)

    render json: {
      filings: filings.map { |f|
        {
          external_id: f.external_id,
          cik: f.cik,
          manager_name: f.name,
          report_date: f.report_date,
          report_year: f.report_year,
          report_quarter: f.report_quarter,
          date_filed: f.date_filed,
          form_type: f.form_type,
          amendment_type: f.amendment_type,
          holdings_count: f.holdings_count_calculated,
          holdings_value: f.holdings_value_calculated,
          path: "/13f/#{f.external_id}"
        }
      },
      pagination: {
        current_page: filings.current_page,
        total_pages: filings.total_pages,
        total_count: filings.total_count
      }
    }
  end

  def manager_filings_data
    filer = ThirteenFFiler.find_by!(cik: params[:cik])

    filings = filer.
      thirteen_fs.
      without_xml_fields.
      most_recent.
      page(params[:page] || 1).
      per(params[:per_page] || 50)

    render json: {
      manager: {
        cik: filer.cik,
        name: filer.name,
        location: filer.city_and_state
      },
      filings: filings.map { |f|
        {
          external_id: f.external_id,
          report_date: f.report_date,
          report_year: f.report_year,
          report_quarter: f.report_quarter,
          date_filed: f.date_filed,
          form_type: f.form_type,
          amendment_type: f.amendment_type,
          holdings_count: f.holdings_count_calculated,
          holdings_value: f.holdings_value_calculated,
          path: "/13f/#{f.external_id}"
        }
      },
      pagination: {
        current_page: filings.current_page,
        total_pages: filings.total_pages,
        total_count: filings.total_count
      }
    }
  end

  private

  def set_public_cache_header
    expires_in 1.hour, public: true
  end
end
