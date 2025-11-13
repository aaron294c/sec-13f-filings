Rails.application.routes.draw do
  # API routes for data (keep these as JSON endpoints)
  get '/data/autocomplete', to: 'data#autocomplete', as: :autocomplete
  get '/data/managers', to: 'data#managers_list', as: :managers_list_data
  get '/data/newest', to: 'data#newest_filings_data', as: :newest_filings_data
  get '/data/manager/:cik/filings', to: 'data#manager_filings_data', as: :manager_filings_data
  get '/data/13f/:external_id', to: 'data#thirteen_f_data', as: :thirteen_f_data
  get '/data/13f/:external_id/detailed', to: 'data#thirteen_f_detailed_data', as: :thirteen_f_detailed_data
  get '/data/13f/:external_id/compare/:other_external_id', to: 'data#compare_holdings_data', as: :thirteen_f_comparison_data
  get '/data/cusip/:cusip/:year/:quarter', to: 'data#all_cusip_holders_data', as: :all_cusip_holders_data
  get '/data/manager/:cik/cusip/:cusip', to: 'data#manager_cusip_history_data', as: :manager_cusip_history_data
  get '/data/superinvestors/stats', to: 'data#superinvestor_stats', as: :superinvestor_stats_data

  # All other routes render the React SPA
  root to: 'home#index'
  get '/managers', to: 'home#index'
  get '/newest', to: 'home#index'
  get '/superinvestors', to: 'home#index'
  get '/manager/*path', to: 'home#index'
  get '/13f/*path', to: 'home#index'
  get '/cusip/*path', to: 'home#index'

  # Catch-all for React Router (exclude /data and /packs for assets)
  get '*path', to: 'home#index', constraints: ->(req) {
    !req.path.starts_with?('/data') && !req.path.starts_with?('/packs')
  }
end
