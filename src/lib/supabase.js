import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ppmnwxcopwbbvltqqimw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_IT8fv0DDX27a7j_JajbvxQ_O_N9ltvU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
