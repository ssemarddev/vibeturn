<?php

namespace Common\Database\Datasource\Filters\Traits;

use Common\Database\Datasource\DatasourceFilters;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

trait SupportsMysqlFilters
{
    public function applyMysqlFilters(DatasourceFilters $filters, $query)
    {
        foreach ($filters->getAll() as $filter) {
            if ($filter['value'] === 'null') {
                $filter['value'] = null;
            } elseif ($filter['value'] === 'false') {
                $filter['value'] = false;
            }
            if ($filter['value'] === 'true') {
                $filter['value'] = true;
            }

            $method = 'where' . ucfirst(str_replace('_id', '', $filter['key']));
            if ($query->hasNamedScope($method)) {
                $query->$method(
                    $filter['value'],
                    $filter['operator'],
                    $filter['key'],
                );
            } elseif ($filter['operator'] === 'between') {
                $query->whereBetween(
                    $this->maybeQualifyFilterColumn($filter['key']),
                    [$filter['value']['start'], $filter['value']['end']],
                );
            } elseif (
                $filter['operator'] === 'has' ||
                $filter['operator'] === 'doesntHave'
            ) {
                $relName = $filter['key'];
                $relation = $query->getModel()->$relName();
                if (
                    $relation instanceof HasMany ||
                    $relation instanceof HasOne
                ) {
                    $query = $this->filterByHasManyRelation(
                        $query,
                        $relation,
                        $filter,
                    );
                } elseif ($relation instanceof BelongsToMany) {
                    $query = $this->filterByManyToManyRelation(
                        $query,
                        $relation,
                        $filter,
                    );
                }
            } elseif ($filter['operator'] === 'hasAll') {
                $genreIds = $filter['value'];
                $relName = $filter['key'];
                $relation = $query->getModel()->$relName();
                $query->whereIn(
                    $query->getModel()->qualifyColumn('id'),
                    fn(Builder $query) => $query
                        ->select($relation->getQualifiedForeignPivotKeyName())
                        ->from($relation->getTable())
                        ->whereIn(
                            $relation->getQualifiedRelatedPivotKeyName(),
                            $genreIds,
                        )
                        ->when(
                            count($genreIds) > 1,
                            fn(Builder $query) => $query
                                ->groupBy(
                                    $relation->getQualifiedForeignPivotKeyName(),
                                )
                                ->having(
                                    DB::raw('COUNT(*)'),
                                    '=',
                                    count($genreIds),
                                ),
                        ),
                );
            } elseif (
                in_array($filter['operator'], [
                    'contains',
                    'notContains',
                    'startsWith',
                    'endsWith',
                ])
            ) {
                $query = $query->where(
                    $this->maybeQualifyFilterColumn($filter['key']),
                    $filter['operator'] === 'notContains' ? 'not like' : 'like',
                    match ($filter['operator']) {
                        'contains', 'notContains' => "%{$filter['value']}%",
                        'startsWith' => "{$filter['value']}%",
                        'endsWith' => "%{$filter['value']}",
                    },
                );
            } elseif ($filter['operator'] === 'notNull') {
                $query->whereNotNull(
                    $this->maybeQualifyFilterColumn($filter['key']),
                );
            } else {
                $query = $query->where(
                    $this->maybeQualifyFilterColumn($filter['key']),
                    $filter['operator'],
                    $filter['value'],
                );
            }
        }

        return $query;
    }

    private function filterByHasManyRelation($query, $relation, array $filter)
    {
        $related = $relation->getRelated()->getTable();
        $foreignKey = $relation->getQualifiedForeignKeyName();
        $parentKey = $relation->getQualifiedParentKeyName();

        // use left join to check if model has any of specified relations
        if ($filter['value'] === '*') {
            $query
                // prevent null values from being returned when using left join
                ->when(empty($query->getQuery()->getColumns()), function ($q) {
                    $q->select($q->getModel()->getTable() . '.*');
                })
                ->leftJoin($related, $foreignKey, '=', $parentKey)
                ->where(
                    $foreignKey,
                    $filter['operator'] === 'doesntHave' ? '=' : '!=',
                    null,
                );
            // use left join to check if model has relation with specified ID
        } else {
            $query
                ->leftJoin($related, $foreignKey, '=', $parentKey)
                ->where(
                    "$related.id",
                    $filter['operator'] === 'has' ? '=' : '!=',
                    $filter['value'],
                );
            if ($filter['operator'] === 'doesntHave') {
                $this->query->orWhere("$related.id", null);
            }
        }

        return $query;
    }

    private function filterByManyToManyRelation(
        $query,
        $relation,
        array $filter,
    ) {
        if ($filter['operator'] === 'has') {
            $values = is_array($filter['value'])
                ? $filter['value']
                : [$filter['value']];

            $query->join(
                $relation->getTable(),
                $relation->getQualifiedParentKeyName(),
                '=',
                $relation->getQualifiedForeignPivotKeyName(),
            );

            $query->where(function ($q) use ($values, $relation) {
                foreach ($values as $value) {
                    $q->orWhere(
                        $relation->getQualifiedRelatedPivotKeyName(),
                        '=',
                        $value,
                    );
                }
            });

            if ($relation instanceof MorphToMany) {
                $query->where(
                    $relation->getMorphType(),
                    $relation->getMorphClass(),
                );
            }
        } elseif ($filter['operator'] === 'doesntHave') {
            $table = $query->getModel()->getTable();
            $query->whereNotIn("$table.id", function (Builder $builder) use (
                $filter,
                $query,
            ) {
                $relName = $filter['key'];
                $relation = $query->getModel()->$relName();
                $builder
                    ->select($relation->getQualifiedForeignPivotKeyName())
                    ->from($relation->getTable())
                    ->where(
                        $relation->getQualifiedRelatedPivotKeyName(),
                        $filter['value'],
                    );
            });
        }

        return $query;
    }

    protected function maybeQualifyFilterColumn(string $key): string
    {
        if (str_contains($key, '.')) {
            return $key;
        }

        $model = $this->query->getModel();

        if (
            !method_exists($model, 'filterableFields') ||
            !in_array($key, $model::filterableFields())
        ) {
            return $key;
        }

        return $this->query->getModel()->qualifyColumn($key);
    }
}
