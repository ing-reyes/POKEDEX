import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {
  private dafaultLimit: number;
  constructor(
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>,

    private readonly configService: ConfigService,
  ){
    this.dafaultLimit = configService.get<number>('defaultLimit');
  }
  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    
    try {
      const pokemon = await this.pokemonModel.create( createPokemonDto );
      return pokemon;
    } catch (error) {
      this.handleException(error);
    }

  }

  findAll( paginationDto: PaginationDto ) {
    const { limit = this.dafaultLimit, offset = 0 } = paginationDto;
    return this.pokemonModel.find()
    .limit( limit )
    .skip( offset );
  }

  async findOne( term: string ) {
    let pokemon: Pokemon;

    // no
    if( !isNaN(+term) ) {
      pokemon = await this.pokemonModel.findOne( { no: term } );
    }

    // MongoID
    if( !pokemon && isValidObjectId( term ) ) {
      pokemon = await this.pokemonModel.findById( term );
    }

    // name
    if( !pokemon ) {
      pokemon = await this.pokemonModel.findOne( { name: term.toLocaleLowerCase().trim() } );
    }
    
    if( !pokemon ) throw new NotFoundException(`Pokemon with id, name or no "${ term }" not found`);
    
    return pokemon;

    
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne( term );

    if( updatePokemonDto.name ){
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase().trim();
    }

    try {
      await pokemon.updateOne( updatePokemonDto );
      return {...pokemon.toJSON(), ...updatePokemonDto};
    } catch (error) {
      this.handleException(error);
    }
  }

  async remove(id: string) {
    // const pokemon = await this.findOne( id );
    // await pokemon.deleteOne();
    // return {id};

    // const deletedPokemon = await this.pokemonModel.findByIdAndDelete( id );

    const { deletedCount } = await this.pokemonModel.deleteOne( { _id: id } )
    if( deletedCount === 0 ) throw new BadRequestException( `Pokemon with id ${id} not found` );
    
    return;
  }

  private handleException( error: any ){
    if( error.code === 11000 ){
      throw new ConflictException( `Pokemon exists in db ${ Object.keys(error.keyPattern)}: ${ Object.values(error.keyValue) }` )
    }
    console.log(error);
    throw new InternalServerErrorException( 'Cant update pokemon - check server logs' )
  }
}
