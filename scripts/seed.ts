import { CargoClient } from 'poro'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const cargo = new CargoClient()

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function parseSeason(name: string): { season: string; split: string } {
    const seasonMatch = name.match(/\d{4}/)
    const season = seasonMatch ? seasonMatch[0] : 'Unknown'         // condition ? valueIfTrue : valueIfFalse,
                                                                    // so if regex for seasonMatch is not NULL, 
                                                                    // then match found, so use seasonMatch[0], 
                                                                    // otherwise, use 'Unknown'

    const split = name.split(season)[1]?.trim() ?? 'Unknown'

    return { season, split }
}