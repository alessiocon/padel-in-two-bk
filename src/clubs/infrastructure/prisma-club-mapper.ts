import {
  Prisma,
  Club as PrismaClub,
  Court as PrismaCourt,
  ClubMember as PrismaClubMamber,
  ClubStatus as PrismaClubStatus,
  CourtStatus as PrismaCourtStatus,
  ClubRole as   PrismaClubRole,
  PromotionType as PrismaPromotionType,
} from '@prisma/client';
import { Club, ClubStatus,  type ClubProps } from '../domain/club.aggregate.js';
import { Court, CourtStatus } from '../domain/entity/court.entity.js';
import { ClubResDto, ClubsResDto } from '../presentation/club.dto.js';
import { ClubMember, ClubRole } from '../domain/entity/club.member.entity.js';
import { PricingRulePriceMode, PricingRuleScope } from '../../club-pricing/domain/pricing-rule.entity.js';
import { PrismaPricingRuleMapper } from '../../club-pricing/infrastructure/prisma-pricing-rule-mapper.js';
import { PromotionType } from '../../promotions/domain/promotion-type.js';

// ==========================================
// PRISMA SELECTION TYPES (PER READ MODELS)
// ==========================================

export const clubSummarySelect = Prisma.validator<Prisma.ClubSelect>()({
  id: true,
  name: true,
  promotions: true,
  email: true,
  status: true,
  slotDurationMinutes: true,
  openingTime: true,
  closingTime: true,
  position: true,
  racketPrice: true,
  members: true,
  courts: {
    select: {
      id: true,
      price: true,
      isIndoor: true,
    },
  },
});

export const clubDetailSelect = Prisma.validator<Prisma.ClubSelect>()({
  ...clubSummarySelect,
  timezone: true,
  courts: true,
  members: true,
  pricingRules: {
    select: {
      id: true,
      clubId: true,
      name: true,
      scope: true,
      courtLinks: {
        select: {
          courtId: true,
        },
      },
      weekdays: true,
      startTime: true,
      endTime: true,
      validFrom: true,
      validUntil: true,
      priceMode: true,
      value: true,
      priority: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    }
  }
});

export type PrismaClubSummarySelect = Prisma.ClubGetPayload<{
  select: typeof clubSummarySelect;
}>;

export type PrismaClubDetailSelect = Prisma.ClubGetPayload<{
  select: typeof clubDetailSelect;
}>;

export type PrismaClubWithCourts = PrismaClub & {
  courts: PrismaCourt[] 
  members: PrismaClubMamber[];
};


export class ClubMapper {
  public static readonly PRISMA_TO_DOMAIN_PROMOTION_TYPE: Record<PrismaPromotionType, PromotionType> = {
    [PrismaPromotionType.ACCUMULATE_POINTS]: PromotionType.ACCUMULATE_POINTS,
    [PrismaPromotionType.RACKET_FREE]: PromotionType.RACKET_FREE,
  };

  public static readonly DOMAIN_TO_PRISMA_PROMOTION_TYPE: Record<PromotionType, PrismaPromotionType> = {
    [PromotionType.ACCUMULATE_POINTS]: PrismaPromotionType.ACCUMULATE_POINTS,
    [PromotionType.RACKET_FREE]: PrismaPromotionType.RACKET_FREE,
  };

  public static readonly PRISMA_TO_DOMAIN_CLUB_STATUS: Record<PrismaClubStatus, ClubStatus> = {
    [PrismaClubStatus.ACTIVE]: ClubStatus.ACTIVE,
    [PrismaClubStatus.INACTIVE]: ClubStatus.INACTIVE,
  };

  public static readonly DOMAIN_TO_PRISMA_CLUB_STATUS: Record<ClubStatus, PrismaClubStatus> = {
    [ClubStatus.ACTIVE]: PrismaClubStatus.ACTIVE,
    [ClubStatus.INACTIVE]: PrismaClubStatus.INACTIVE,
  };

  public static readonly PRISMA_TO_DOMAIN_COURT_STATUS: Record<PrismaCourtStatus, CourtStatus> = {
    [PrismaCourtStatus.AVAILABLE]: CourtStatus.AVAILABLE,
    [PrismaCourtStatus.RESERVED]: CourtStatus.RESERVED,
    [PrismaCourtStatus.MAINTENANCE]: CourtStatus.MAINTENANCE,
    [PrismaCourtStatus.INACTIVE]: CourtStatus.INACTIVE,
  };

  public static readonly DOMAIN_TO_PRISMA_COURT_STATUS: Record<CourtStatus, PrismaCourtStatus> = {
    [CourtStatus.AVAILABLE]: PrismaCourtStatus.AVAILABLE,
    [CourtStatus.RESERVED]: PrismaCourtStatus.RESERVED,
    [CourtStatus.MAINTENANCE]: PrismaCourtStatus.MAINTENANCE,
    [CourtStatus.INACTIVE]: PrismaCourtStatus.INACTIVE,
  };

  public static readonly DOMAIN_TO_PRISMA_CLUB_ROLE: Record<ClubRole, PrismaClubRole> = {
    [ClubRole.OWNER]: PrismaClubRole.OWNER,
    [ClubRole.MANAGER]: PrismaClubRole.MANAGER,
    [ClubRole.COACH]: PrismaClubRole.COACH,
    [ClubRole.STAFF]: PrismaClubRole.STAFF,
  };

  public static readonly PRISMA_TO_DOMAIN_CLUB_ROLE: Record<PrismaClubRole, ClubRole> = {
    [PrismaClubRole.OWNER]: ClubRole.OWNER,
    [PrismaClubRole.MANAGER]: ClubRole.MANAGER,
    [PrismaClubRole.COACH]: ClubRole.COACH,
    [PrismaClubRole.STAFF]: ClubRole.STAFF,
  };

  private static toNumber(val: unknown): number {
    if (typeof val === 'number') return val;
    if (val && typeof (val as { toNumber?: () => number }).toNumber === 'function') {
      return (val as { toNumber: () => number }).toNumber();
    }
    return Number(val ?? 0);
  }

  static toDomain(record: PrismaClubWithCourts): Club {
    const props: ClubProps = {
      id: record.id,
      name: record.name,
      promotions: record.promotions.map(promotion => this.PRISMA_TO_DOMAIN_PROMOTION_TYPE[promotion]),
      email: record.email,
      status: this.PRISMA_TO_DOMAIN_CLUB_STATUS[record.status],
      position: record.position,
      timezone: record.timezone,
      racketPrice: this.toNumber(record.racketPrice),
      slotDurationMinutes: record.slotDurationMinutes,
      openingTime: record.openingTime,
      closingTime: record.closingTime,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      members: (record.members ?? []).map((member) => ClubMember.reconstitute({
        id: member.id,
        userId: member.userId,
        clubId: member.clubId,
        role: this.PRISMA_TO_DOMAIN_CLUB_ROLE[member.role],
        permissions: member.permissions,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
      })),
      courts: (record.courts ?? []).map((court) => Court.reconstitute({
          id: court.id,
          clubId: court.clubId,
          name: court.name,
          isIndoor: court.isIndoor,
          size: court.size,
          price: this.toNumber(court.price),
          status: this.PRISMA_TO_DOMAIN_COURT_STATUS[court.status],
          offsetMinutes: court.offsetMinutes ?? 0
        })),
    };

    return Club.reconstitute(props);
  }

  static toPersistence(club: Club): Prisma.ClubCreateInput {
    return {
      id: club.id,
      name: club.name,
      promotions: club.promotions.map(promotion => this.DOMAIN_TO_PRISMA_PROMOTION_TYPE[promotion]),
      email: club.email,
      status: this.DOMAIN_TO_PRISMA_CLUB_STATUS[club.status],
      position: club.position,
      timezone: club.timezone,
      racketPrice: new Prisma.Decimal(club.racketPrice),
      slotDurationMinutes: club.slotDurationMinutes,
      openingTime: club.openingTime,
      closingTime: club.closingTime,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
    };
  }

  static toCourtPersistence(court: Court): Prisma.CourtCreateManyInput {
    return {
      id: court.id,
      clubId: court.clubId,
      name: court.name,
      isIndoor: court.isIndoor,
      price: new Prisma.Decimal(court.price),
      status: this.DOMAIN_TO_PRISMA_COURT_STATUS[court.status],
      offsetMinutes: court.offsetMinutes
    };
  }

  static prismaToClubMemberDomain(raw: PrismaClubMamber): ClubMember {
    return ClubMember.reconstitute({
      id: raw.id,      
      userId: raw.userId,       
      clubId: raw.clubId,       
      role: this.PRISMA_TO_DOMAIN_CLUB_ROLE[raw.role],
      permissions: raw.permissions, 
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }


  /**
   * Mappa la proiezione Prisma nel DTO di riassunto
   */
  static toSummaryDto(record: PrismaClubSummarySelect): ClubsResDto {
    let courtsInDoor = 0;
    let courtsOutDoor = 0;
    let totalPrice = 0;

    const courts = record.courts ?? [];
    courts.forEach((court) => {
      if (court.isIndoor) courtsInDoor++;
      else courtsOutDoor++;

      totalPrice += this.toNumber(court.price);
    });

    const totalCourts = courts.length;
    const averagePrice = totalCourts > 0 ? Number((totalPrice / totalCourts).toFixed(2)) : 0;

    const { courts: _, status, racketPrice, ...props } = record;

    return {
      ...props,
      promotions: record.promotions.map(promotion => this.PRISMA_TO_DOMAIN_PROMOTION_TYPE[promotion]),
      status: this.PRISMA_TO_DOMAIN_CLUB_STATUS[status],
      courtsInDoor,
      courtsOutDoor,
      averagePrice,
      racketPrice: this.toNumber(racketPrice),
      members: props.members.map((member) => {
        return {
          id: member.id,
          userId: member.userId,
          clubId: member.clubId,
          role: this.PRISMA_TO_DOMAIN_CLUB_ROLE[member.role],
          permissions: member.permissions,
        }
      })
    };
  }

  /**
   * Mappa la proiezione Prisma nel DTO di dettaglio
   */
  static toDetailDto(record: PrismaClubDetailSelect): ClubResDto {
    const summary = this.toSummaryDto(record);

    const mappedCourts = record.courts.map((court) => {
      const { price, status: courtStatus, ...courtProps } = court;
      return {
        ...courtProps,
        price: this.toNumber(price),
        status: this.PRISMA_TO_DOMAIN_COURT_STATUS[courtStatus],
      };
    });

    return {
      ...summary,
      timezone: record.timezone,
      courts: mappedCourts,
      members: record.members.map((member) => {
        return {
          id: member.id,
          userId: member.userId,
          clubId: member.clubId,
          role: this.PRISMA_TO_DOMAIN_CLUB_ROLE[member.role],
          permissions: member.permissions,
        }
      }),

      priceRoles: record.pricingRules?.map((rule) => {
        return {
          id: rule.id,
          clubId: rule.clubId,
          name: rule.name,
          scope: PrismaPricingRuleMapper.PRISMA_TO_DOMAIN_SCOPE[rule.scope],
          courtIds: rule.courtLinks.map(link => link.courtId),
          weekdays: rule.weekdays,
          startTime: rule.startTime,
          endTime: rule.endTime,
          validFrom: rule.validFrom,
          validUntil: rule.validUntil,
          priceMode: PrismaPricingRuleMapper.PRISMA_TO_DOMAIN_PRICE_MODE[rule.priceMode],
          value: Number(rule.value),
          priority: rule.priority,
          isActive: rule.isActive,
          createdAt: rule.createdAt,
          updatedAt: rule.updatedAt
        }
      }) ?? []
    };
  }
}