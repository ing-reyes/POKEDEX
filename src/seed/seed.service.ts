import { Injectable } from '@nestjs/common';
import { PokeResponse } from './imterfaces/poke-response.interface';
import { Model } from 'mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>,
    private readonly http: AxiosAdapter,
  ){}
  async executeSeed() {
    await this.pokemonModel.deleteMany({}); // Delete all pokemons

    const data = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650')
    
    const pokemons = data.results.map(({ name, url }) => {
      const no = +url.split('/').at(-2);
      return { name, no }
    })

    await this.pokemonModel.insertMany( pokemons );

    return { ok: true, message: 'Seed executed' };
  }
}
